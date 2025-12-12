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
from .redis_helpers import persist_ydoc_to_db, ydoc_key, active_set_key, voice_room_key, user_color_key, ACTIVE_PROJECTS_SET, ASYNC_REDIS

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

        # Mark user active
        await ASYNC_REDIS.sadd(active_set_key(self.project_id), str(self.user.pk))
        await ASYNC_REDIS.expire(active_set_key(self.project_id), 60)
        await ASYNC_REDIS.sadd(ACTIVE_PROJECTS_SET, str(self.project_id))

        # Notify others
        await self.channel_layer.group_send(self.room, {"type": "users_changed"})

        # Send Initial YJS Sync
        ydoc_bytes = await ASYNC_REDIS.get(ydoc_key(self.project_id))
        if ydoc_bytes:
            await self.send_json({
                "type": "sync",
                "ydoc_b64": base64.b64encode(ydoc_bytes).decode()
            })
        else:
            code_obj = await database_sync_to_async(lambda: getattr(Project.objects.get(id=self.project_id), "code", None))()
            text = code_obj.content if code_obj else ""
            await self.send_json({"type": "initial", "content": text})

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
                await ASYNC_REDIS.srem(active_set_key(self.project_id), str(self.user.pk))
                await ASYNC_REDIS.srem(voice_room_key(self.project_id), str(self.user.pk))
                await ASYNC_REDIS.delete(user_color_key(str(self.user.pk)))
                
                await self.channel_layer.group_send(self.room, {"type": "users_changed"})
                await self.channel_layer.group_send(self.room, {"type": "voice_room_update"})
                
                await self.channel_layer.group_send(
                    self.room,
                    {
                        "type": "broadcast.remove_awareness",
                        "user_id": str(self.user.pk),
                        "sender": self.channel_name
                    }
                )

                remaining = await ASYNC_REDIS.scard(active_set_key(self.project_id))
                if remaining == 0:
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
            active_user_ids = await ASYNC_REDIS.smembers(active_set_key(self.project_id))
            active_users = []

            for uid_bytes in active_user_ids:
                uid = int(uid_bytes)
                try:
                    user_obj = await database_sync_to_async(User.objects.get)(pk=uid)
                    
                    color_data = await ASYNC_REDIS.get(user_color_key(uid))
                    if color_data:
                        color = json.loads(color_data)
                    else:
                        color = random.choice(settings.USER_COLORS)
                        await ASYNC_REDIS.set(user_color_key(uid), json.dumps(color))

                    active_users.append({
                        "id": str(user_obj.pk),
                        "email": user_obj.email,
                        "color": color["color"],
                        "colorLight": color["light"]
                    })
                except User.DoesNotExist:
                    continue

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
                ydoc_bytes = await ASYNC_REDIS.get(ydoc_key(self.project_id))
                if ydoc_bytes:
                    await self.send_json({
                        "type": "sync",
                        "ydoc_b64": base64.b64encode(ydoc_bytes).decode()
                    })
                else:
                    code_obj = await database_sync_to_async(lambda: getattr(Project.objects.get(id=self.project_id), "code", None))()
                    text = code_obj.content if code_obj else ""
                    await self.send_json({"type": "initial", "content": text})

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
                
                user_obj = await database_sync_to_async(User.objects.get)(pk=self.user.pk)
                color_data = await ASYNC_REDIS.get(f"user_color:{self.user.pk}")
                color = json.loads(color_data) if color_data else {"color": "#30bced", "light": "#30bced33"}
                
                await self.channel_layer.group_send(self.room, {
                    "type": "broadcast.chat_message",
                    "message": message,
                    "user_id": str(self.user.pk),
                    "user_email": user_obj.email,
                    "color": color["color"],
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
                uid = int(uid_bytes)
                try:
                    user_obj = await database_sync_to_async(User.objects.get)(pk=uid)
                    voice_users.append({"id": str(user_obj.pk), "email": user_obj.email})
                except User.DoesNotExist:
                    continue
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
        cur = await ASYNC_REDIS.get(key)
        ydoc = YDoc()
        if cur: apply_update(ydoc, cur)
        apply_update(ydoc, update_bytes)
        new_bytes = Y.encode_state_as_update(ydoc)

        if len(new_bytes) > settings.MAX_MESSAGE_SIZE:
            # Skip update if too large
            print(f"Skipping update for project {project_id}: size {len(new_bytes)} exceeds {settings.MAX_MESSAGE_SIZE}")
            return
        
        await ASYNC_REDIS.set(key, new_bytes)

    async def _heartbeat_loop(self):
        try:
            while True:
                await asyncio.sleep(settings.HEARTBEAT_INTERVAL)
                if self.user and self.user.is_authenticated:
                    await ASYNC_REDIS.expire(active_set_key(self.project_id), 60)
        except asyncio.CancelledError:
            return