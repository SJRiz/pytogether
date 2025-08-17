import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Code, CodeVersion

class CodeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.group_name = f"project_{self.project_id}_code"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get("content")

        # Save current code
        code = await database_sync_to_async(Code.objects.get)(project_id=self.project_id)
        code.content = content
        await database_sync_to_async(code.save)()

        # Save a new version
        version_count = await database_sync_to_async(code.versions.count)()
        await database_sync_to_async(CodeVersion.objects.create)(
            code=code,
            content=content,
            version_number=version_count + 1
        )

        # Broadcast update to all clients
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "code_update",
                "content": content
            }
        )

    async def code_update(self, event):
        await self.send(text_data=json.dumps({"content": event["content"]}))