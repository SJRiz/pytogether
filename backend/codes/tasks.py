from celery import shared_task

from .redis_helpers import persist_ydoc_to_db, SYNC_REDIS, ACTIVE_PROJECTS_SET

@shared_task
def snapshot_active_projects():
    """Loop through all active projects and save their code to the db"""
    project_ids = SYNC_REDIS.smembers(ACTIVE_PROJECTS_SET)
    processed = []

    for id in project_ids:
        try:
            pid = int(id)
        except Exception:
            continue

        # A lock isn't really necessary yet, but it's nice to have when we scale
        lock = SYNC_REDIS.lock(f"lock:project_persist:{pid}", timeout=10)
        got = lock.acquire(blocking=False)
        if not got:
            continue
        try:
            persist_ydoc_to_db(pid)
            processed.append(pid)
        finally:
            try:
                lock.release()
            except Exception:
                pass
            
    return processed
    
