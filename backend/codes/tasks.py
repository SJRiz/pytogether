from celery import shared_task
from .redis_helpers import persist_ydoc_to_db, active_set_key, SYNC_REDIS, DIRTY_PROJECTS_SET, ACTIVE_PROJECTS_SET

@shared_task
def snapshot_dirty_projects():
    """Pop dirty projects from Redis and save their state to the DB"""
    
    dirty_project_ids = SYNC_REDIS.spop(DIRTY_PROJECTS_SET, count=50)
    
    if not dirty_project_ids:
        return {"processed": [], "skipped": []}

    processed = []
    skipped = []

    for id_bytes in dirty_project_ids:
        try:
            pid = int(id_bytes)
        except (ValueError, TypeError):
            continue

        lock = SYNC_REDIS.lock(f"lock:project_persist:{pid}", timeout=10)
        got = lock.acquire(blocking=False)
        
        if not got:
            # If it's locked, someone else is saving it
            SYNC_REDIS.sadd(DIRTY_PROJECTS_SET, str(pid))
            skipped.append(pid)
            continue
            
        try:
            # Save to database
            persist_ydoc_to_db(pid)
            processed.append(pid)
        except Exception as e:
            print(f"Error persisting project {pid}: {e}")
            # If the database goes down, put the project back in the queue
            SYNC_REDIS.sadd(DIRTY_PROJECTS_SET, str(pid))
            skipped.append(pid)
        finally:
            try:
                lock.release()
            except Exception:
                pass
                
    return {"processed": processed, "skipped": skipped}

@shared_task
def cleanup_ghost_projects():
    """Garbage collection: Finds projects marked as active that have no actual connected users."""
    project_ids = SYNC_REDIS.smembers(ACTIVE_PROJECTS_SET)
    cleaned_ghosts = []

    for id_bytes in project_ids:
        try:
            pid = int(id_bytes)
        except (ValueError, TypeError):
            continue

        # Check if anyone is actually in the room right now
        active_count = SYNC_REDIS.hlen(active_set_key(pid))
        
        if active_count == 0:
            lock = SYNC_REDIS.lock(f"lock:project_persist:{pid}", timeout=10)
            got = lock.acquire(blocking=False)
            
            if not got:
                continue
                
            try:
                persist_ydoc_to_db(pid)
                
                # Clean it out of the active set
                SYNC_REDIS.srem(ACTIVE_PROJECTS_SET, str(pid))
                cleaned_ghosts.append(pid)
            except Exception as e:
                print(f"Error cleaning up ghost project {pid}: {e}")
            finally:
                try:
                    lock.release()
                except Exception:
                    pass
                    
    return {"cleaned_ghosts": cleaned_ghosts}