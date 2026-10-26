import httpx
import time

# Cache khusus untuk kalender
_calendar_cache = {
    "data": None,
    "last_fetch": 0
}

def fetch_calendar(from_date, to_date, impact="high"):
    global _calendar_cache
    
    now = time.time()
    # Jika data ada di cache dan umurnya belum 1 jam (3600 detik), gunakan cache
    if _calendar_cache["data"] is not None and (now - _calendar_cache["last_fetch"]) < 3600:
        cached_data = _calendar_cache["data"]
    else:
        # Jika cache kosong atau sudah kedaluwarsa, tarik dari API
        print("[CALENDAR] Menarik data baru dari Forex Factory...")
        url = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
        try:
            r = httpx.get(url, timeout=15)
            r.raise_for_status()
            cached_data = r.json()
            # Simpan ke cache
            _calendar_cache["data"] = cached_data
            _calendar_cache["last_fetch"] = now
        except Exception as e:
            print(f"[CALENDAR ERROR] Gagal ambil kalender: {e}")
            # Jika gagal, gunakan cache lama (jika ada) daripada menampilkan kosong
            if _calendar_cache["data"] is not None:
                cached_data = _calendar_cache["data"]
            else:
                cached_data = []

    # Filter berdasarkan impact
    result = []
    for e in cached_data:
        if impact and impact.lower() != "all":
            if e.get("impact", "").lower() != impact.lower():
                continue
                
        result.append({
            "title": e.get("title", ""),
            "country": e.get("country", ""),
            "date": e.get("date", ""),
            "impact": e.get("impact", ""),
            "forecast": e.get("forecast", ""),
            "previous": e.get("previous", "")
        })
    return result
