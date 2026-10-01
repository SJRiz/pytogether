import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

# initialize
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
app = Celery("backend")

# read configuration from Django settings, CELERY_ prefix for keys
app.config_from_object("django.conf:settings", namespace="CELERY")

# auto-discover tasks in INSTALLED_APPS tasks.py
app.autodiscover_tasks()

# define beat schedule
app.conf.beat_schedule = {
    "snapshot-codes-per-minutes": {
        "task": "codes.tasks.snapshot_dirty_projects",
        "schedule": settings.AUTO_SAVE_INTERVAL,
    },
    "cleanup-ghosts-every-10-mins": {
        'task': 'codes.tasks.cleanup_ghost_projects',
        'schedule': settings.GHOST_CLEAN_INTERVAL,
    },
    "log-daily-stats": {
        'task': 'codes.tasks.log_daily_stats_task',
        'schedule': crontab(hour=23, minute=55),
    },
    "record-system-resources": {
        'task': 'codes.tasks.record_system_resources_task',
        'schedule': 300.0,
    },
}

