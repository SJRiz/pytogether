import logging
import psutil
from datetime import datetime
from utils.redis_helpers import SYNC_REDIS, ASYNC_REDIS, ACTIVE_PROJECTS_SET

logger = logging.getLogger(__name__)

def get_today():
    return datetime.utcnow().strftime("%Y-%m-%d")

async def track_user_async(user_id):
    try:
        date = get_today()
        await ASYNC_REDIS.sadd(f"stats_users:{date}", str(user_id))
        await ASYNC_REDIS.expire(f"stats_users:{date}", 86400 * 2)
    except Exception as e:
        logger.error(f"Error tracking user async: {e}")

async def track_project_opened_async():
    try:
        date = get_today()
        await ASYNC_REDIS.incr(f"stats_projects:{date}")
        await ASYNC_REDIS.expire(f"stats_projects:{date}", 86400 * 2)
    except Exception as e:
        logger.error(f"Error tracking project opened async: {e}")

async def track_max_room_async(room_size):
    try:
        date = get_today()
        key = f"stats_max_room:{date}"
        
        val = await ASYNC_REDIS.get(key)
        max_so_far = int(val) if val else 0
        if room_size > max_so_far:
            await ASYNC_REDIS.set(key, room_size, ex=86400*2)
    except Exception as e:
        logger.error(f"Error tracking max room async: {e}")
        
async def track_max_active_rooms_async():
    try:
        date = get_today()
        key = f"stats_max_active_rooms:{date}"
        
        active_rooms = await ASYNC_REDIS.scard(ACTIVE_PROJECTS_SET)
        val = await ASYNC_REDIS.get(key)
        max_so_far = int(val) if val else 0
        
        if active_rooms > max_so_far:
            await ASYNC_REDIS.set(key, active_rooms, ex=86400*2)
    except Exception as e:
        logger.error(f"Error tracking max active rooms async: {e}")

async def track_ws_connection_async(is_connect):
    try:
        date = get_today()
        if is_connect:
            current = await ASYNC_REDIS.incr(f"current_ws_connections")
            key = f"stats_max_ws:{date}"
            val = await ASYNC_REDIS.get(key)
            max_so_far = int(val) if val else 0
            if current > max_so_far:
                await ASYNC_REDIS.set(key, current, ex=86400*2)
        else:
            await ASYNC_REDIS.decr(f"current_ws_connections")
    except Exception as e:
        logger.error(f"Error tracking ws connection async: {e}")

def track_user_sync(user_id):
    try:
        date = get_today()
        SYNC_REDIS.sadd(f"stats_users:{date}", str(user_id))
        SYNC_REDIS.expire(f"stats_users:{date}", 86400 * 2)
    except Exception as e:
        logger.error(f"Error tracking user sync: {e}")

def record_system_resources_sync():
    try:
        date = get_today()
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory().percent
        
        # Track CPU
        SYNC_REDIS.incrbyfloat(f"stats_cpu_sum:{date}", cpu)
        SYNC_REDIS.incr(f"stats_cpu_count:{date}")
        val_max_cpu = SYNC_REDIS.get(f"stats_cpu_max:{date}")
        max_cpu = float(val_max_cpu) if val_max_cpu else 0.0
        if cpu > max_cpu:
            SYNC_REDIS.set(f"stats_cpu_max:{date}", cpu, ex=86400*2)
            
        # Track RAM
        SYNC_REDIS.incrbyfloat(f"stats_ram_sum:{date}", mem)
        SYNC_REDIS.incr(f"stats_ram_count:{date}")
        val_max_ram = SYNC_REDIS.get(f"stats_ram_max:{date}")
        max_ram = float(val_max_ram) if val_max_ram else 0.0
        if mem > max_ram:
            SYNC_REDIS.set(f"stats_ram_max:{date}", mem, ex=86400*2)
            
        SYNC_REDIS.expire(f"stats_cpu_sum:{date}", 86400*2)
        SYNC_REDIS.expire(f"stats_cpu_count:{date}", 86400*2)
        SYNC_REDIS.expire(f"stats_ram_sum:{date}", 86400*2)
        SYNC_REDIS.expire(f"stats_ram_count:{date}", 86400*2)
    except Exception as e:
        logger.error(f"Error recording system resources: {e}")

def get_and_log_daily_stats():
    date = get_today()
    
    try:
        # Total users
        users_count = SYNC_REDIS.scard(f"stats_users:{date}")
        
        # Total projects opened
        projects_opened = SYNC_REDIS.get(f"stats_projects:{date}")
        projects_opened = int(projects_opened) if projects_opened else 0
        
        # Largest code session
        max_room = SYNC_REDIS.get(f"stats_max_room:{date}")
        max_room = int(max_room) if max_room else 0
        
        # Largest amount of active sessions
        max_active_rooms = SYNC_REDIS.get(f"stats_max_active_rooms:{date}")
        max_active_rooms = int(max_active_rooms) if max_active_rooms else 0
        
        # Resource usage
        cpu_sum = SYNC_REDIS.get(f"stats_cpu_sum:{date}")
        cpu_count = SYNC_REDIS.get(f"stats_cpu_count:{date}")
        cpu_max = SYNC_REDIS.get(f"stats_cpu_max:{date}")
        
        avg_cpu = (float(cpu_sum) / float(cpu_count)) if cpu_sum and cpu_count and float(cpu_count) > 0 else psutil.cpu_percent(interval=1)
        max_cpu = float(cpu_max) if cpu_max else avg_cpu
        
        ram_sum = SYNC_REDIS.get(f"stats_ram_sum:{date}")
        ram_count = SYNC_REDIS.get(f"stats_ram_count:{date}")
        ram_max = SYNC_REDIS.get(f"stats_ram_max:{date}")
        
        avg_ram = (float(ram_sum) / float(ram_count)) if ram_sum and ram_count and float(ram_count) > 0 else psutil.virtual_memory().percent
        max_ram = float(ram_max) if ram_max else avg_ram
        
        # Max WebSocket connections
        max_ws = SYNC_REDIS.get(f"stats_max_ws:{date}")
        max_ws = int(max_ws) if max_ws else 0
    except Exception as e:
        logger.error(f"Error fetching daily stats from redis: {e}")
        users_count = projects_opened = max_room = max_active_rooms = max_ws = 0
        avg_cpu = max_cpu = avg_ram = max_ram = 0.0
    
    log_message = (
        f"\\n{'='*40}\\n"
        f"DAILY STATS FOR {date}\\n"
        f"{'='*40}\\n"
        f"Unique Users (Logins/Returning): {users_count}\\n"
        f"Total Projects Opened: {projects_opened}\\n"
        f"Largest Room (Concurrent Users): {max_room}\\n"
        f"Peak Active Rooms: {max_active_rooms}\\n"
        f"Peak WebSocket Connections: {max_ws}\\n"
        f"CPU Usage: {avg_cpu:.1f}% Avg / {max_cpu:.1f}% Max\\n"
        f"RAM Usage: {avg_ram:.1f}% Avg / {max_ram:.1f}% Max\\n"
        f"{'='*40}\\n"
    )
    
    print(log_message)
    logger.info(log_message)
    
    # Save to a physical log file in the backend folder and keep max 7 logs
    log_file_path = "daily_stats.txt"
    try:
        import os
        # Read existing logs if any
        existing_blocks = []
        if os.path.exists(log_file_path):
            with open(log_file_path, "r") as f:
                content = f.read()
                # Split by the separator we use for daily stats
                separator = f"\\n{'='*40}\\nDAILY STATS FOR"
                blocks = content.split(separator)
                
                # The first element might be empty or partial depending on how it's split
                for b in blocks:
                    if b.strip():
                        # Re-add the separator text that got removed during split
                        existing_blocks.append(separator + b)
                        
        # Add the new log message
        existing_blocks.append(log_message)
        
        # Keep only the last 7 blocks
        if len(existing_blocks) > 7:
            existing_blocks = existing_blocks[-7:]
            
        with open(log_file_path, "w") as f:
            f.write("".join(existing_blocks))
            
    except Exception as e:
        print(f"Failed to write to {log_file_path}: {e}")
        
    return log_message
