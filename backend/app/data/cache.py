import time

_cache = {}

def get(key):
    if key in _cache:
        value, expiry = _cache[key]
        if time.time() < expiry:
            print(f"[CACHE HIT] Mengambil {key} dari memori.")
            return value
        else:
            print(f"[CACHE EXPIRED] {key} sudah kedaluwarsa.")
            del _cache[key]
    return None

def set(key, value, ttl_seconds=300):
    print(f"[CACHE SET] Menyimpan {key} ke memori selama {ttl_seconds} detik.")
    _cache[key] = (value, time.time() + ttl_seconds)
