from django.core.management.base import BaseCommand
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from codes.tasks import snapshot_active_projects
from codes.redis_helpers import SYNC_REDIS

class Command(BaseCommand):
    help = "Snapshot all active projects, disconnect all websockets, and flush Redis"

    def handle(self, *args, **options):
        self.stdout.write("Starting safe update")

        # Snapshot all currently active projects
        self.stdout.write("Snapshotting active projects...")
        snapshot_active_projects()
        self.stdout.write(self.style.SUCCESS("Snapshot complete"))

        # Force disconnect all active websockets
        self.stdout.write("Forcing disconnect of all active websockets...")
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_send)(
            "global_connection_group",
            {"type": "force_disconnect"}
        )
        self.stdout.write(self.style.SUCCESS("All active websockets disconnect"))

        # Flush Redis
        self.stdout.write("Flushing Redis...")
        SYNC_REDIS.flushall()
        self.stdout.write(self.style.SUCCESS("Redis flush complete"))

        self.stdout.write(self.style.SUCCESS("Safe update procedure finished"))
