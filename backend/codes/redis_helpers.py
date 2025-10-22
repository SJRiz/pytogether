import os
import redis
import redis.asyncio as aioredis
from y_py import YDoc, apply_update

from django.db import transaction
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

def user_color_key(user_id):
    return f"user_color:{user_id}"          # colors for each user

def persist_ydoc_to_db(project_id):
    """Saves the code to the database"""
    try:
        # Django ORM is sync, so we need to use redis synchronously too
        bytes_val = SYNC_REDIS.get(ydoc_key(project_id))
        if not bytes_val:
            return
        
        ydoc = YDoc()
        apply_update(ydoc, bytes_val)
        t = ydoc.get_text("codetext")
        text = str(t)

        # Make the db operation atomic just incase
        with transaction.atomic():
            project = Project.objects.select_for_update().get(id=project_id)
            code, _ = Code.objects.get_or_create(project=project)

            # Don't save if no changes made
            if code.content == text:
                return
            code.content = text
            code.save()

        print(f"Saved {len(text)} chars to DB")

    except Project.DoesNotExist:
        # project removed; cleanup redis keys
        SYNC_REDIS.delete(ydoc_key(project_id))
        SYNC_REDIS.srem(ACTIVE_PROJECTS_SET, str(project_id))
        SYNC_REDIS.delete(active_set_key(project_id))

    except Exception as e:
        print(f"Error persisting YDoc to DB: {e}")