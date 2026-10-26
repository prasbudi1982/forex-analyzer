from datetime import datetime, timezone
import dateutil.parser

def is_blackout(calendar_events, now, window_min=30):
    """
    Mengecek apakah saat ini berada dalam window blackout berita high-impact.
    window_min: rentang waktu (menit) sebelum dan sesudah berita.
    """
    for e in calendar_events:
        # Hanya cek berita High Impact
        if e.get("impact", "").lower() != "high":
            continue
            
        try:
            # Forex Factory menggunakan format ISO (contoh: 2026-10-24T08:30:00-04:00)
            event_time = dateutil.parser.isoparse(e["date"])
            
            # Pastikan timezone 'now' sama dengan event (UTC)
            if now.tzinfo is None:
                now = now.replace(tzinfo=timezone.utc)
                
            selisih_menit = abs((event_time - now).total_seconds()) / 60
            
            if selisih_menit <= window_min:
                return True, e
        except Exception as ex:
            print(f"Gagal parse tanggal berita: {ex}")
            continue
            
    return False, None
