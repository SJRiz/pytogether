from celery import shared_task
from .redis_helpers import persist_ydoc_to_db, SYNC_REDIS, ACTIVE_PROJECTS_SET, active_set_key

@shared_task
def snapshot_active_projects():
    """Loop through all active projects and save their code to the db"""
    project_ids = SYNC_REDIS.smembers(ACTIVE_PROJECTS_SET)
    processed = []
    cleaned_ghosts = []

    for id_bytes in project_ids:
        try:
            pid = int(id_bytes)
        except Exception:
            continue

        # Check if anyone is actually in the room right now
        active_count = SYNC_REDIS.scard(active_set_key(pid))
        if active_count == 0:
            SYNC_REDIS.srem(ACTIVE_PROJECTS_SET, str(pid))
            cleaned_ghosts.append(pid)

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
            
    return {"processed": processed, "cleaned_ghosts": cleaned_ghosts}