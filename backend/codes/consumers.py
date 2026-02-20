import json
import base64
import asyncio
import random
import y_py as Y
from urllib.parse import parse_qs

from django.contrib.auth import get_user_model
from django.conf import settings
from django.core import signing 
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from y_py import YDoc, apply_update

from projects.models import Project
from .redis_helpers import persist_ydoc_to_db, ydoc_key, active_set_key, voice_room_key, user_profile_key, ACTIVE_PROJECTS_SET, ASYNC_REDIS

User = get_user_model()

class YjsCodeConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.group_id = int(self.scope["url_route"]["kwargs"]["group_id"])
        self.project_id = int(self.scope["url_route"]["kwargs"]["project_id"])
        self.room = f"project_room_g{self.group_id}_p{self.project_id}"
        self.forced_disconnect = False

        self.user = self.scope.get("user")

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        is_member = await self._validate_membership(self.user, self.group_id, self.project_id)
        print(self.group_id, self.project_id, self.user.email, "is_member:", is_member)
        if not is_member:

            query_string = self.scope['query_string'].decode()
            params = parse_qs(query_string) # Returns dict like {'token': ['...'], 'share_token': ['...']}
            
            # parse_qs returns a list for each key, so we take the first one
            share_token = params.get('share_token', [None])[0]

            if not self._validate_share_token(share_token, self.group_id, self.project_id):
                print(f"Connection rejected: User {self.user.email} is not a member and invalid token.")
                await self.close(code=4003)
                return

        # Connection Accepted
        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.channel_layer.group_add("global_connection_group", self.channel_name)
        await self.accept()

        # Mark user active with HINCRBY (adds 1 to their tab count)
        current_connections = await ASYNC_REDIS.hincrby(active_set_key(self.project_id), str(self.user.pk), 1)
        
        # 60 second TTL
        await ASYNC_REDIS.expire(active_set_key(self.project_id), 60)
        await ASYNC_REDIS.sadd(ACTIVE_PROJECTS_SET, str(self.project_id))

        # Create the user profile in the redis cache if not exists
        if not await ASYNC_REDIS.exists(user_profile_key(str(self.user.pk))):
                color = random.choice(settings.USER_COLORS)
                await ASYNC_REDIS.hset(user_profile_key(str(self.user.pk)), mapping={
                    "email": self.user.email,
                    "color": color["color"],
                    "colorLight": color["light"]
                })
                # Set it to expire after 24 hours
                await ASYNC_REDIS.expire(user_profile_key(str(self.user.pk)), 86400)

        # notify others if this is their first tab opening
        if current_connections == 1:
            await self.channel_layer.group_send(self.room, {"type": "users_changed"})

        # Send Initial YJS Sync
        ydoc_bytes = await self._get_or_create_ydoc_bytes()
        
        await self.send_json({
            "type": "sync",
            "ydoc_b64": base64.b64encode(ydoc_bytes).decode()
        })
        
        await self._send_voice_room_update()
        self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())

    def _validate_share_token(self, token, current_gid, current_pid):
        """Helper to validate signed share links"""
        if not token:
            return False
        
        signer = signing.TimestampSigner()
        try:
            data = signer.unsign_object(token)
            
            if str(data.get('pid')) == str(current_pid) and \
               str(data.get('gid')) == str(current_gid) and \
               data.get('type') == 'share_link':
                return True
                
        except (signing.BadSignature, signing.SignatureExpired):
            return False
            
        return False

    async def disconnect(self, close_code):
        try:
            if self.user and self.user.is_authenticated:
                # Always remove from voice room
                await ASYNC_REDIS.srem(voice_room_key(self.project_id), str(self.user.pk))
                await self.channel_layer.group_send(self.room, {"type": "voice_room_update"})
                
                # Subtract 1 from their tab count
                remaining_connections = await ASYNC_REDIS.hincrby(active_set_key(self.project_id), str(self.user.pk), -1)
                
                # broadcast disconnect if their last tab closed
                if remaining_connections <= 0:
                    # Clean them out of the hash entirely
                    await ASYNC_REDIS.hdel(active_set_key(self.project_id), str(self.user.pk))
                    
                    await self.channel_layer.group_send(self.room, {"type": "users_changed"})
                    await self.channel_layer.group_send(
                        self.room,
                        {
                            "type": "broadcast.remove_awareness",
                            "user_id": str(self.user.pk),
                            "sender": self.channel_name
                        }
                    )

                # Check if room is completely empty using HLEN (Hash Length)
                remaining_users = await ASYNC_REDIS.hlen(active_set_key(self.project_id))
                if remaining_users == 0:
                    await ASYNC_REDIS.srem(ACTIVE_PROJECTS_SET, str(self.project_id))
                    if not self.forced_disconnect:
                        await database_sync_to_async(persist_ydoc_to_db)(self.project_id)

        except Exception as e:
            print(f"Error during disconnect cleanup: {e}")

        if hasattr(self, "heartbeat_task"):
            self.heartbeat_task.cancel()

        await self.channel_layer.group_discard(self.room, self.channel_name)
        await self.channel_layer.group_discard("global_connection_group", self.channel_name)

    async def force_disconnect(self, event):
        self.forced_disconnect = True
        await self.close(code=4000)

    async def broadcast_remove_awareness(self, event):
        if event.get("sender") == self.channel_name:
            return
        await self.send_json({"type": "remove_awareness", "user_id": event["user_id"]})

    async def users_changed(self, event):
        try:
            active_user_ids = await ASYNC_REDIS.hkeys(active_set_key(self.project_id))
            active_users = []

            for uid_bytes in active_user_ids:
                uid = int(uid_bytes)
                
                user_data = await ASYNC_REDIS.hgetall(user_profile_key(str(uid)))
                
                if not user_data:
                    continue 

                active_users.append({
                    "id": str(uid),
                    "email": user_data[b'email'].decode('utf-8'),
                    "color": user_data[b'color'].decode('utf-8'),
                    "colorLight": user_data[b'colorLight'].decode('utf-8')
                })

            await self.send_json({"type": "connection", "users": active_users})
        except Exception as e:
            print(f"Error in users_changed: {e}")

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        if len(text_data.encode()) > settings.MAX_MESSAGE_SIZE:
            await self.send_json({"type": "error", "message": "Message too large"})
            return
        
        try:
            msg = json.loads(text_data)
            mtype = msg.get("type")
        except Exception:
            return

        try:
            if mtype == "update":
                update_b64 = msg.get("update_b64")
                if not update_b64: return
                update_bytes = base64.b64decode(update_b64)
                await self._apply_update_to_redis_ydoc(self.project_id, update_bytes)
                await self.channel_layer.group_send(self.room, {
                    "type": "broadcast.update",
                    "update_b64": update_b64,
                    "sender": self.channel_name
                })

            elif mtype == "request_sync":
                ydoc_bytes = await self._get_or_create_ydoc_bytes()
                
                await self.send_json({
                    "type": "sync",
                    "ydoc_b64": base64.b64encode(ydoc_bytes).decode()
                })

            elif mtype == "awareness":
                update_b64 = msg.get("update_b64")
                if not update_b64: return
                await self.channel_layer.group_send(self.room, {
                    "type": "broadcast.awareness",
                    "update_b64": update_b64,
                    "sender": self.channel_name
                })

            elif mtype == "chat_message":
                message = msg.get("message", "").strip()
                if not message or len(message) > 1000: return
                
                # Fetch everything from the local cache instead of DB
                user_data = await ASYNC_REDIS.hgetall(user_profile_key(str(self.user.pk)))
                
                if user_data:
                    email = user_data[b'email'].decode('utf-8')
                    color = user_data[b'color'].decode('utf-8')
                else:
                    email = "Unknown"
                    color = "#30bced"

                await self.channel_layer.group_send(self.room, {
                    "type": "broadcast.chat_message",
                    "message": message,
                    "user_id": str(self.user.pk),
                    "user_email": email,
                    "color": color,
                    "timestamp": asyncio.get_event_loop().time()
                })

            elif mtype == "join_voice":
                await ASYNC_REDIS.sadd(voice_room_key(self.project_id), str(self.user.pk))
                await self.channel_layer.group_send(self.room, {"type": "voice_room_update"})

            elif mtype == "leave_voice":
                await ASYNC_REDIS.srem(voice_room_key(self.project_id), str(self.user.pk))
                await self.channel_layer.group_send(self.room, {"type": "voice_room_update"})

            elif mtype == "voice_signal":
                target_user = msg.get("target_user")
                signal_data = msg.get("signal_data")
                if target_user and signal_data:
                    await self.channel_layer.group_send(self.room, {
                        "type": "broadcast.voice_signal",
                        "from_user": str(self.user.pk),
                        "target_user": target_user,
                        "signal_data": signal_data,
                        "sender": self.channel_name
                    })

            elif mtype == "ping":
                await self.send(json.dumps({'type': 'pong', 'timestamp': msg.get('timestamp')}))
            
        except Exception as e:
            print(f"Error processing message: {e}")

    async def broadcast_update(self, event):
        if event.get("sender") == self.channel_name: return
        await self.send_json({"type": "update", "update_b64": event["update_b64"]})
    
    async def broadcast_awareness(self, event):
        if event.get("sender") == self.channel_name: return
        await self.send_json({"type": "awareness", "update_b64": event["update_b64"]})

    async def broadcast_chat_message(self, event):
        await self.send_json({
            "type": "chat_message",
            "message": event["message"],
            "user_id": event["user_id"],
            "user_email": event["user_email"],
            "color": event["color"],
            "timestamp": event["timestamp"]
        })

    async def voice_room_update(self, event):
        await self._send_voice_room_update()

    async def broadcast_voice_signal(self, event):
        if event.get("sender") == self.channel_name: return
        if event["target_user"] == str(self.user.pk):
            await self.send_json({
                "type": "voice_signal",
                "from_user": event["from_user"],
                "signal_data": event["signal_data"]
            })

    async def _send_voice_room_update(self):
        try:
            voice_user_ids = await ASYNC_REDIS.smembers(voice_room_key(self.project_id))
            voice_users = []
            for uid_bytes in voice_user_ids:
                uid = str(int(uid_bytes))
                user_data = await ASYNC_REDIS.hgetall(user_profile_key(uid))
                if user_data:
                    voice_users.append({
                        "id": uid, 
                        "email": user_data[b'email'].decode('utf-8')
                    })
                    
            await self.send_json({"type": "voice_room_update", "participants": voice_users})
        except Exception as e:
            print(f"Error sending voice room update: {e}")

    @database_sync_to_async
    def _validate_membership(self, user, group_id, project_id):
        try:
            project = Project.objects.select_related("group").get(id=project_id)
        except Project.DoesNotExist:
            return False
        if project.group.id != group_id:
            return False
        return user in project.group.group_members.all()

    async def _apply_update_to_redis_ydoc(self, project_id, update_bytes: bytes):
        key = ydoc_key(project_id)
        lock_key = f"{key}:lock"

        # Acquire a Redis lock specific to this project
        try:
            async with ASYNC_REDIS.lock(lock_key, timeout=5, blocking_timeout=5):
                cur = await ASYNC_REDIS.get(key)
                ydoc = YDoc()

                try:
                    # Apply base state
                    if cur: 
                        apply_update(ydoc, cur)
                    # Apply new delta
                    apply_update(ydoc, update_bytes)

                except Exception as e:
                    print(f"Poison update rejected for project {project_id}: {e}")
                    # Boot the offending user so they resync from the healthy Redis state
                    await self.channel_layer.group_send(
                        self.room,
                        {"type": "force_disconnect"}
                    )
                    return
                
                new_bytes = Y.encode_state_as_update(ydoc)

                if len(new_bytes) > settings.MAX_MESSAGE_SIZE:
                    print(f"Skipping update for project {project_id}: size exceeds limit")
                    return
                
                # Atomically save the perfectly merged state back to Redis
                await ASYNC_REDIS.set(key, new_bytes)
        except Exception as e:
            print(f"Failed to acquire lock or write to Redis for project {project_id}: {e}")

    async def _heartbeat_loop(self):
        try:
            while True:
                await asyncio.sleep(settings.HEARTBEAT_INTERVAL)
                if self.user and self.user.is_authenticated:
                    # Extend the TTL for another 60 seconds
                    await ASYNC_REDIS.expire(active_set_key(self.project_id), 60)
                    await ASYNC_REDIS.expire(voice_room_key(self.project_id), 60)
        except asyncio.CancelledError:
            return
    
    async def _get_or_create_ydoc_bytes(self):
        """Fetches the YDoc from Redis, or initializes it securely from the DB."""
        ydoc_bytes = await ASYNC_REDIS.get(ydoc_key(self.project_id))
        
        if ydoc_bytes:
            return ydoc_bytes
            
        # Redis is empty. Fetch the raw text from the database
        code_obj = await database_sync_to_async(lambda: getattr(Project.objects.get(id=self.project_id), "code", None))()
        text = code_obj.content if code_obj else ""
        
        # Initialize a brand new Yjs Document on the server
        new_ydoc = YDoc()
        ytext = new_ydoc.get_text('codetext')
        
        # Safely insert the database text into the server's CRDT
        with new_ydoc.begin_transaction() as txn:
            ytext.extend(txn, text)
            
        # Convert to binary update
        new_bytes = Y.encode_state_as_update(new_ydoc)
        
        # Save to Redis immediately so it is permanently synchronized
        await ASYNC_REDIS.set(ydoc_key(self.project_id), new_bytes)
        
        return new_bytes