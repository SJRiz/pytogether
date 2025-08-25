import os
import redis
from celery import shared_task
from y_py import YDoc, apply_update
from django.db import transaction

from .models import Code
from projects.models import Project
from .redis_helpers import active_set_key, ydoc_key, ACTIVE_PROJECTS_SET


REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
redis_client = redis.Redis.from_url(REDIS_URL)

MAX_LOCK_SECONDS = 10

@shared_task
def snapshot_active_projects():
    project_ids = redis_client.smembers(ACTIVE_PROJECTS_SET)
    processed = []
    for pid_b in project_ids:
        try:
            pid = int(pid_b)
        except Exception:
            continue
        lock = redis_client.lock(f"lock:project_persist:{pid}", timeout=MAX_LOCK_SECONDS)
        got = lock.acquire(blocking=False)
        if not got:
            continue
        try:
            persist_single_project(pid)
            processed.append(pid)
        finally:
            try:
                lock.release()
            except Exception:
                pass
    return processed

def persist_single_project(project_id: int):
    key = ydoc_key(project_id)
    bytes_val = redis_client.get(key)

    if not bytes_val:
        return
    
    ydoc = YDoc()
    apply_update(ydoc, bytes_val)  # apply stored Yjs update bytes

    # client must store code at 'codetext'
    try:
        ytext = ydoc.get_text("codetext")
        text = str(ytext)
    except Exception:
        text = ""
    # Persist to DB transactionally
    try:
        with transaction.atomic():
            project = Project.objects.select_for_update().get(id=project_id)
            code, _ = Code.objects.get_or_create(project=project)
            if code.content == text:
                return  # no changes were made so....
            code.content = text
            code.save()

    except Project.DoesNotExist:
        # project removed; cleanup redis keys
        redis_client.delete(key)
        redis_client.srem(ACTIVE_PROJECTS_SET, str(project_id))
        redis_client.delete(active_set_key(project_id))
    
