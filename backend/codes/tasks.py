import os
import redis
from celery import shared_task
from y_py import YDoc
from django.db import transaction

from .models import Code
from projects.models import Project
from .redis_helpers import active_set_key, ACTIVE_PROJECTS_SET


REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
r = redis.Redis.from_url(REDIS_URL)

ydoc_key_template = "project_ydoc:{}"

MAX_LOCK_SECONDS = 10

@shared_task
def snapshot_active_projects():
    project_ids = r.smembers(ACTIVE_PROJECTS_SET)
    for pid_b in project_ids:
        try:
            pid = int(pid_b)
        except Exception:
            continue
        # Use redis lock per project to avoid conflicts with consumer persist-on-disconnect
        lock = r.lock(f"lock:project_persist:{pid}", timeout=MAX_LOCK_SECONDS)
        got = lock.acquire(blocking=False)
        if not got:
            continue
        try:
            persist_single_project(pid)
        finally:
            try:
                lock.release()
            except Exception:
                pass

def persist_single_project(project_id: int):
    key = ydoc_key_template.format(project_id)
    bytes_val = r.get(key)
    if not bytes_val:
        return
    # Deserialize ydoc and extract text
    ydoc = YDoc()
    try:
        ydoc.deserialize(bytes_val)
    except Exception:
        return
    # client must store code at 'codetext'
    try:
        ytext = ydoc.get_text("codetext")
        text = ytext.to_string()
    except Exception:
        text = ""
    # Persist to DB transactionally
    try:
        with transaction.atomic():
            project = Project.objects.select_for_update().get(id=project_id)
            code, _ = Code.objects.get_or_create(project=project)
            code.content = text
            code.save()
    except Project.DoesNotExist:
        # project removed; cleanup redis keys
        r.delete(key)
        r.srem(ACTIVE_PROJECTS_SET, str(project_id))
        r.delete(active_set_key(project_id))
