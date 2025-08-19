import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

app = Celery("backend")

# read configuration from Django settings, CELERY_ prefix for keys
app.config_from_object("django.conf:settings", namespace="CELERY")

# auto-discover tasks in INSTALLED_APPS tasks.py
app.autodiscover_tasks()

# define beat schedule
app.conf.beat_schedule = {
    "snapshot-codes-every-5-minutes": {
        "task": "codes.tasks.snapshot_active_projects",
        "schedule": 360.0,
    },
}