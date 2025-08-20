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
from y_py import YDoc, apply_update

from projects.models import Project
from .models import Code

from .redis_helpers import ydoc_key, active_set_key, ACTIVE_PROJECTS_SET


User = get_user_model()

REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
redis_client = aioredis.from_url(REDIS_URL, decode_responses=False)  # store bytes

class YjsCodeConsumer(AsyncJsonWebsocketConsumer):
    """
    WS path: /ws/groups/<group_id>/projects/<project_id>/code/
    Expects client to send/receive base64-encoded Yjs updates:
      {"type": "update", "update_b64": "<base64 update bytes>"}
    Also supports a "sync" message to request full state.
    """
    async def connect(self):
        self.group_id = int(self.scope["url_route"]["kwargs"]["group_id"])
        self.project_id = int(self.scope["url_route"]["kwargs"]["project_id"])
        self.room = f"project_room_g{self.group_id}_p{self.project_id}"
        print("recieving connection")
        user = self.scope.get("user")
        print(user)
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        good = await self._validate_membership(user, self.group_id, self.project_id)
        if not good:
            await self.close(code=4003) # not good
            return

        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()

        # Mark user active in redis set and add project to active_projects
        await redis_client.sadd(active_set_key(self.project_id), str(user.pk))
        await redis_client.sadd(ACTIVE_PROJECTS_SET, str(self.project_id))

        await self.channel_layer.group_send(
            self.room,
            {
                "type": "users_changed",
            }
        )

        # Send current ydoc state to the client if exists; else send content from DB
        ydoc_bytes = await redis_client.get(ydoc_key(self.project_id))
        if ydoc_bytes:
            # send full state as base64
            await self.send_json({
                "type": "sync",
                "ydoc_b64": base64.b64encode(ydoc_bytes).decode()
            })
        else:
            # fallback: send DB content as a 'snapshot' (client can apply as full text)
            code = await database_sync_to_async(lambda: getattr(Project.objects.get(id=self.project_id), "code", None))()
            text = code.content if code else ""
            await self.send_json({"type": "initial", "content": text})

    async def disconnect(self, close_code):
        user = self.scope.get("user")
        print(user, "is leaving")
        if user and user.is_authenticated:

            await redis_client.srem(active_set_key(self.project_id), str(user.pk))
            await self.channel_layer.group_send(
                self.room,
                {
                    "type": "users_changed",
                }
            )

            # if set is empty now, persist immediately and remove from active_projects
            remaining = await redis_client.scard(active_set_key(self.project_id))
            if remaining == 0:
                # remove project from active_projects
                await redis_client.srem(ACTIVE_PROJECTS_SET, str(self.project_id))
                # persist now
                await self._persist_ydoc_to_db(self.project_id)
        await self.channel_layer.group_discard(self.room, self.channel_name)
    
    async def users_changed(self, event):
        # Get all active users in this project
        active_user_ids = await redis_client.smembers(active_set_key(self.project_id))

        # Convert IDs to user info
        active_users = []
        for uid_bytes in active_user_ids:
            uid = int(uid_bytes)
            user_obj = await database_sync_to_async(lambda: User.objects.get(pk=uid))()
            active_users.append({"id": str(user_obj.pk), "email": user_obj.email})

        # Send current active users to the newly connected client
        await self.send_json({
            "type": "connection",
            "users": active_users
        })

    async def receive(self, text_data=None, bytes_data=None):
        """
        Expect JSON text messages from clients:
          - update: {"type":"update","update_b64":"..."}
          - request sync: {"type":"request_sync"}
        Clients must send base64-encoded Yjs update bytes.
        """
        if text_data is None:
            return
        try:
            msg = json.loads(text_data)
        except Exception:
            return

        mtype = msg.get("type")
        if mtype == "update":
            update_b64 = msg.get("update_b64")
            if not update_b64:
                return
            update_bytes = base64.b64decode(update_b64)

            # apply update to server-side ydoc stored in redis
            await self._apply_update_to_redis_ydoc(self.project_id, update_bytes)

            # broadcast update to other clients
            await self.channel_layer.group_send(self.room, {
                "type": "broadcast.update",
                "update_b64": update_b64,
                "sender": self.channel_name
            })
        elif mtype == "request_sync":
            ydoc_bytes = await redis_client.get(ydoc_key(self.project_id))
            if ydoc_bytes:
                await self.send_json({"type": "sync", "ydoc_b64": base64.b64encode(ydoc_bytes).decode()})
            else:
                code = await database_sync_to_async(lambda: getattr(Project.objects.get(id=self.project_id), "code", None))()
                text = code.content if code else ""
                await self.send_json({"type": "initial", "content": text})

    async def broadcast_update(self, event):
        # Don't echo back to the sender
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
        """
        Convert Y.Doc to text (assuming doc contains e.g. Y.Text at 'codetext')
        and persist to Code.content
        """
        
        key = ydoc_key(project_id)
        
        # Use sync redis client
        sync_redis = redis.from_url(REDIS_URL)
        bytes_val = sync_redis.get(key)
        if not bytes_val:
            # nothing buffered
            return
        
        ydoc = YDoc()
        apply_update(ydoc, bytes_val)
        
        # Extract text content
        try:
            t = ydoc.get_text("codetext")
            text = str(t)
        except Exception as e:
            print(f"ERROR extracting text: {e}")
            text = ""
        
        # Save to DB with transaction
        try:
            with transaction.atomic():  # Wrap in transaction
                code, created = Code.objects.get_or_create(
                    project_id=project_id,
                    defaults={'content': text}
                )
                if not created:
                    if code.content == text:
                        return  # no changes were made so....
                    code.content = text
                    code.save()
            print(f"Successfully saved {len(text)} characters to DB")
        except Exception as e:
            print(f"ERROR saving to DB: {e}")
