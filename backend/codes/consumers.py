import json
import base64
import os
import asyncio
import redis
import redis.asyncio as aioredis
import y_py as Y

from django.contrib.auth import get_user_model
from django.db import transaction
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from y_py import YDoc, apply_update, encode_state_as_update

from projects.models import Project
from .models import Code
from .redis_helpers import ydoc_key, active_set_key, ACTIVE_PROJECTS_SET

User = get_user_model()

REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
redis_client = aioredis.from_url(REDIS_URL, decode_responses=False)

# Max message size in bytes to prevent malicious payloads
MAX_MESSAGE_SIZE = 2_000_000  # ~2MB


class YjsCodeConsumer(AsyncJsonWebsocketConsumer):
    HEARTBEAT_INTERVAL = 10  # seconds

    async def connect(self):
        self.group_id = int(self.scope["url_route"]["kwargs"]["group_id"])
        self.project_id = int(self.scope["url_route"]["kwargs"]["project_id"])
        self.room = f"project_room_g{self.group_id}_p{self.project_id}"
        self.user = self.scope.get("user")

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        if not await self._validate_membership(self.user, self.group_id, self.project_id):
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()

        # Mark user active in Redis with TTL
        await redis_client.sadd(active_set_key(self.project_id), str(self.user.pk))
        await redis_client.expire(active_set_key(self.project_id), 60)  # TTL 60s
        await redis_client.sadd(ACTIVE_PROJECTS_SET, str(self.project_id))

        await self.channel_layer.group_send(
            self.room,
            {"type": "users_changed"}
        )

        # Send current Y.Doc state
        ydoc_bytes = await redis_client.get(ydoc_key(self.project_id))
        if ydoc_bytes:
            await self.send_json({
                "type": "sync",
                "ydoc_b64": base64.b64encode(ydoc_bytes).decode()
            })
        else:
            code_obj = await database_sync_to_async(lambda: getattr(Project.objects.get(id=self.project_id), "code", None))()
            text = code_obj.content if code_obj else ""
            await self.send_json({"type": "initial", "content": text})

        # Start heartbeat loop
        self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())

    async def disconnect(self, close_code):
        try:
            if self.user and self.user.is_authenticated:
                await redis_client.srem(active_set_key(self.project_id), str(self.user.pk))
                await self.channel_layer.group_send(
                    self.room, {"type": "users_changed"}
                )

                remaining = await redis_client.scard(active_set_key(self.project_id))
                if remaining == 0:
                    await redis_client.srem(ACTIVE_PROJECTS_SET, str(self.project_id))
                    await self._persist_ydoc_to_db(self.project_id)
        except Exception as e:
            print(f"Error during disconnect cleanup: {e}")

        if hasattr(self, "heartbeat_task"):
            self.heartbeat_task.cancel()

        await self.channel_layer.group_discard(self.room, self.channel_name)

    async def users_changed(self, event):
        try:
            active_user_ids = await redis_client.smembers(active_set_key(self.project_id))
            active_users = []
            for uid_bytes in active_user_ids:
                uid = int(uid_bytes)
                try:
                    user_obj = await database_sync_to_async(User.objects.get)(pk=uid)
                    active_users.append({"id": str(user_obj.pk), "email": user_obj.email})
                except User.DoesNotExist:
                    continue
            await self.send_json({"type": "connection", "users": active_users})
        except Exception as e:
            print(f"Error in users_changed: {e}")

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        if len(text_data.encode()) > MAX_MESSAGE_SIZE:
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
                if not update_b64:
                    return
                update_bytes = base64.b64decode(update_b64)
                await self._apply_update_to_redis_ydoc(self.project_id, update_bytes)
                await self.channel_layer.group_send(self.room, {
                    "type": "broadcast.update",
                    "update_b64": update_b64,
                    "sender": self.channel_name
                })
            elif mtype == "request_sync":
                ydoc_bytes = await redis_client.get(ydoc_key(self.project_id))
                if ydoc_bytes:
                    await self.send_json({
                        "type": "sync",
                        "ydoc_b64": base64.b64encode(ydoc_bytes).decode()
                    })
                else:
                    code_obj = await database_sync_to_async(lambda: getattr(Project.objects.get(id=self.project_id), "code", None))()
                    text = code_obj.content if code_obj else ""
                    await self.send_json({"type": "initial", "content": text})
        except Exception as e:
            print(f"Error processing message: {e}")

    async def broadcast_update(self, event):
        if event.get("sender") == self.channel_name:
            return
        await self.send_json({"type": "update", "update_b64": event["update_b64"]})

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
        """Load Y.Doc from redis (or create), apply update_bytes, store back."""
        
        key = ydoc_key(project_id)

        # atomic-ish: use a small asyncio lock per project (in-process). For multi-worker safety, use redis lock.
        # Here: we fetch current bytes, apply update with y_py, and write back.
        cur = await redis_client.get(key)
        if cur:
            # cur is serialized Y.Doc bytes
            ydoc = YDoc()
            apply_update(ydoc, cur)  # Apply the stored state
        else:
            ydoc = YDoc()

        # apply the new update
        apply_update(ydoc, update_bytes)

        # serialize and store - use encode_state_as_update instead of serialize
        new_bytes = Y.encode_state_as_update(ydoc)
        await redis_client.set(key, new_bytes)

        # update a dirty marker or timestamp
        await redis_client.set(f"{key}:last_update_ts", str(int(asyncio.get_event_loop().time())), ex=3600)

    @database_sync_to_async
    def _persist_ydoc_to_db(self, project_id):
        try:
            sync_redis = redis.from_url(REDIS_URL)
            bytes_val = sync_redis.get(ydoc_key(project_id))
            if not bytes_val:
                return
            ydoc = YDoc()
            apply_update(ydoc, bytes_val)
            t = ydoc.get_text("codetext")
            text = str(t)
            with transaction.atomic():
                code, created = Code.objects.get_or_create(
                    project_id=project_id,
                    defaults={"content": text}
                )
                if not created and code.content != text:
                    code.content = text
                    code.save()
            print(f"Saved {len(text)} chars to DB")
        except Exception as e:
            print(f"Error persisting YDoc to DB: {e}")

    async def _heartbeat_loop(self):
        """Periodically refresh active user TTL"""
        try:
            while True:
                await asyncio.sleep(self.HEARTBEAT_INTERVAL)
                if self.user and self.user.is_authenticated:
                    await redis_client.expire(active_set_key(self.project_id), 60)
        except asyncio.CancelledError:
            return
