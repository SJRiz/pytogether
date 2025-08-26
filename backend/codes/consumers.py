import json
import base64
import asyncio
import y_py as Y

from django.contrib.auth import get_user_model
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from y_py import YDoc, apply_update

from projects.models import Project
from .redis_helpers import persist_ydoc_to_db, ydoc_key, active_set_key, ACTIVE_PROJECTS_SET, ASYNC_REDIS

User = get_user_model()

# Max message size in bytes to prevent malicious payloads
MAX_MESSAGE_SIZE = 1_000_000  # ~1MB

# We create a consumer object per websocket connection.
class YjsCodeConsumer(AsyncJsonWebsocketConsumer):

    HEARTBEAT_INTERVAL = 10  # how long we wait till we check if the user is still alive

    async def connect(self):
        # The group id and project id come from the url route, and we can use them to generate a room name
        self.group_id = int(self.scope["url_route"]["kwargs"]["group_id"])
        self.project_id = int(self.scope["url_route"]["kwargs"]["project_id"])
        self.room = f"project_room_g{self.group_id}_p{self.project_id}"

        # The user comes from the JWT middleware
        self.user = self.scope.get("user")

        # Security checks...
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return
        if not await self._validate_membership(self.user, self.group_id, self.project_id):
            await self.close(code=4003)
            return

        # add them to the channel layer (which is on memory via redis, keeps track of each room's membership)
        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()

        # Over here, we keep track of active projects on-the-fly. We do this by tracking members per group on redis
        # Mark user active in Redis with TTL (we use this along with the heartbeat interval to note active users)
        await ASYNC_REDIS.sadd(active_set_key(self.project_id), str(self.user.pk))
        await ASYNC_REDIS.expire(active_set_key(self.project_id), 60)  # TTL 60s, time until they are officially disconnected
        await ASYNC_REDIS.sadd(ACTIVE_PROJECTS_SET, str(self.project_id))

        # This is to update the member's list on the client side.
        await self.channel_layer.group_send(
            self.room,
            {"type": "users_changed"}
        )

        # We store all ydocs on redis, this is also used to buffer before saving
        # Send current Y.Doc state (Y.js uses bytes to store metadata)
        ydoc_bytes = await ASYNC_REDIS.get(ydoc_key(self.project_id))
        if ydoc_bytes:
            await self.send_json({
                "type": "sync",
                "ydoc_b64": base64.b64encode(ydoc_bytes).decode()   # bytes > base64 > python string (for json)
            })
        else:
            # User just started the room, send initial code then if they make changes, it'll return ydoc bytes
            code_obj = await database_sync_to_async(lambda: getattr(Project.objects.get(id=self.project_id), "code", None))()
            text = code_obj.content if code_obj else ""
            await self.send_json({"type": "initial", "content": text})

        # Start heartbeat loop
        self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())

    async def disconnect(self):
        try:
            if self.user and self.user.is_authenticated:
                # Remove them from the active users in the redis set
                await ASYNC_REDIS.srem(active_set_key(self.project_id), str(self.user.pk))
                await self.channel_layer.group_send(
                    self.room, {"type": "users_changed"}
                )

                # If there are no more active users in that project they left, remove that project from the active projects set
                remaining = await ASYNC_REDIS.scard(active_set_key(self.project_id))
                if remaining == 0:
                    await ASYNC_REDIS.srem(ACTIVE_PROJECTS_SET, str(self.project_id))

                    # Save the code when a user leaves
                    await database_sync_to_async(persist_ydoc_to_db)(self.project_id)

        except Exception as e:
            print(f"Error during disconnect cleanup: {e}")

        if hasattr(self, "heartbeat_task"):
            # Stop their heartbeat loop
            self.heartbeat_task.cancel()

        await self.channel_layer.group_discard(self.room, self.channel_name)

    async def users_changed(self):
        """Returns all the members in an active project. Loops through the redis set"""

        try:
            active_user_ids = await ASYNC_REDIS.smembers(active_set_key(self.project_id))
            active_users = []
            for id in active_user_ids:
                uid = int(id)
                try:
                    user_obj = await database_sync_to_async(User.objects.get)(pk=uid)
                    active_users.append({"id": str(user_obj.pk), "email": user_obj.email})
                except User.DoesNotExist:
                    continue
            await self.send_json({"type": "connection", "users": active_users})
        except Exception as e:
            print(f"Error in users_changed: {e}")

    async def receive(self, text_data=None, bytes_data=None):
        """Event handler"""

        if not text_data:
            return

        # Prevent big messages
        if len(text_data.encode()) > MAX_MESSAGE_SIZE:
            await self.send_json({"type": "error", "message": "Message too large"})
            return
        
        # Safely parse json data
        try:
            msg = json.loads(text_data)
            mtype = msg.get("type")
        except Exception:
            return

        try:
            # 2 main events: update and request_sync. Ping/pong is just for testing latency
            if mtype == "update":
                # This event is called anytime a user makes a change to the code
                # Y.js sends CRDT updates as base64 strings (since we can't really send bytes over JSON), then we turn them into bytes
                # Apply updates (both to the clients, and to redis)
                update_b64 = msg.get("update_b64")
                if not update_b64:
                    return
                update_bytes = base64.b64decode(update_b64)
                await self._apply_update_to_redis_ydoc(self.project_id, update_bytes)
                await self.channel_layer.group_send(self.room, {
                    "type": "broadcast.update",     # method to send to everyone except the client who made the change
                    "update_b64": update_b64,
                    "sender": self.channel_name
                })

            elif mtype == "request_sync":
                # This is primarily called if the user just joined
                # We can just send them the ydoc data we stored on redis
                ydoc_bytes = await ASYNC_REDIS.get(ydoc_key(self.project_id))
                if ydoc_bytes:
                    await self.send_json({
                        "type": "sync",
                        "ydoc_b64": base64.b64encode(ydoc_bytes).decode()
                    })
                else:
                    # Must've been the first user to join the room (this is already handled by the initial connect but god knows what could happen)
                    code_obj = await database_sync_to_async(lambda: getattr(Project.objects.get(id=self.project_id), "code", None))()
                    text = code_obj.content if code_obj else ""
                    await self.send_json({"type": "initial", "content": text})

            elif mtype == "ping":
                await self.send(json.dumps({
                    'type': 'pong',
                    'timestamp': msg.get('timestamp')
                }))
            return
        except Exception as e:
            print(f"Error processing message: {e}")

    async def broadcast_update(self, event):
        """Prevents the user from sending updates to themselves"""

        if event.get("sender") == self.channel_name:
            return
        await self.send_json({"type": "update", "update_b64": event["update_b64"]})

    @database_sync_to_async
    def _validate_membership(self, user, group_id, project_id):
        """Method to check if a user actually belongs in the group, and the project is valid"""

        try:
            project = Project.objects.select_related("group").get(id=project_id)
        except Project.DoesNotExist:
            return False
        if project.group.id != group_id:
            return False
        return user in project.group.group_members.all()

    async def _apply_update_to_redis_ydoc(self, project_id, update_bytes: bytes):
        """Load Y.Doc from redis (or create), apply update_bytes, store back."""

        key = ydoc_key(project_id)

        # we fetch current bytes, apply update with y_py, and write back.
        cur = await ASYNC_REDIS.get(key)
        if cur:
            # cur is serialized Y.Doc bytes
            ydoc = YDoc()
            apply_update(ydoc, cur)  # Apply the stored state
        else:
            ydoc = YDoc()

        # apply the new update
        apply_update(ydoc, update_bytes)
        new_bytes = Y.encode_state_as_update(ydoc)
        await ASYNC_REDIS.set(key, new_bytes)

    async def _heartbeat_loop(self):
        """Periodically refresh active user TTL"""
        try:
            while True:
                await asyncio.sleep(self.HEARTBEAT_INTERVAL)
                if self.user and self.user.is_authenticated:
                    await ASYNC_REDIS.expire(active_set_key(self.project_id), 60)
        except asyncio.CancelledError:
            return
