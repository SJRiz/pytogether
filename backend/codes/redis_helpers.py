import os
import redis
import redis.asyncio as aioredis
from y_py import YDoc, apply_update

from django.db import transaction
from django.conf import settings
from projects.models import Project
from .models import Code

REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
ASYNC_REDIS = aioredis.from_url(REDIS_URL)
SYNC_REDIS = redis.from_url(REDIS_URL)

ACTIVE_PROJECTS_SET = "active_projects"     # set of all active projects (projects with at least one active editor)

def ydoc_key(project_id):
    return f"project_ydoc:{project_id}"     # contains the ydoc bytes for a specific project

def active_set_key(project_id):
    return f"project_active:{project_id}"   # list of all user ids currently in a room

def voice_room_key(project_id):
    return f"voice_room:{project_id}"       # voice chat participants

def user_profile_key(user_id):
    return f"user_profile:{user_id}"        # email and color for that user

def persist_ydoc_to_db(project_id):
    """Saves the Yjs CRDT code from Redis to the PostgreSQL database."""
    try:
        # Django ORM is sync, so we need to use redis synchronously too
        bytes_val = SYNC_REDIS.get(ydoc_key(project_id))
        if not bytes_val:
            return
        
        ydoc = YDoc()
        apply_update(ydoc, bytes_val)
        t = ydoc.get_text("codetext")
        text = str(t)

        # Measure size in bytes
        byte_size = len(text.encode("utf-8"))
        print(f"YDoc size: {byte_size} bytes")
        if byte_size > settings.MAX_MESSAGE_SIZE:
            print(f"Skipping save: codetext too thicc ({byte_size} bytes)")
            return

        # Make the DB operation atomic to prevent race conditions
        with transaction.atomic():
            project = Project.objects.select_for_update().get(id=project_id)
            code, _ = Code.objects.get_or_create(project=project)

            # Only execute a database write if changes were actually made
            if code.content != text:
                code.content = text
                code.save()
                print(f"Saved {len(text)} chars to DB")
            else:
                print("Skipped DB save: No changes detected")

        # Let the document stay warm in RAM for 24 hours, then auto-delete.
        # This prevents the memory leak without breaking active/returning sessions.
        SYNC_REDIS.expire(ydoc_key(project_id), 86400)

    except Project.DoesNotExist:
        # Project was permanently removed; do a hard cleanup of Redis keys
        print(f"Project {project_id} not found. Cleaning up Redis keys.")
        SYNC_REDIS.delete(ydoc_key(project_id))
        SYNC_REDIS.srem(ACTIVE_PROJECTS_SET, str(project_id))
        SYNC_REDIS.delete(active_set_key(project_id))

    except Exception as e:
        print(f"Error persisting YDoc to DB for project {project_id}: {e}")