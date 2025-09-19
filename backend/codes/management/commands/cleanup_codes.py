from django.core.management.base import BaseCommand
from codes.tasks import snapshot_active_projects
from codes.redis_helpers import SYNC_REDIS

class Command(BaseCommand):
    help = "Snapshot all active projects and flush Redis"

    def handle(self, *args, **options):
        snapshot_active_projects()
        SYNC_REDIS.flushall()
        self.stdout.write(self.style.SUCCESS("Snapshot + Redis flush complete"))
