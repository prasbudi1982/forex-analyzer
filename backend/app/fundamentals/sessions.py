from datetime import datetime, timezone

def get_current_session():
    """
    Menentukan sesi pasar berdasarkan jam UTC.
    - Asia/Tokyo: 00:00 - 08:00 UTC
    - London: 08:00 - 16:00 UTC
    - New York: 13:00 - 21:00 UTC
    - Overlap London/NY: 13:00 - 16:00 UTC (Volatilitas tertinggi)
    """
    now = datetime.now(timezone.utc)
    hour = now.hour
    weekday = now.weekday()

    # Akhir pekan (Sabtu=5, Minggu=6)
    if weekday >= 5:
        return {
            "session": "Market Tutup",
            "volatility": "Low",
            "warning": "Pasar forex tutup di akhir pekan."
        }

    # Tentukan Sesi
    if 13 <= hour < 16:
        session = "London / New York Overlap"
        volatility = "Sangat Tinggi"
        warning = "Sesi terbaik untuk trading. Volatilitas sangat tinggi."
    elif 8 <= hour < 13:
        session = "London"
        volatility = "Tinggi"
        warning = "Sesi London dibuka. Tren seringkali kuat."
    elif 16 <= hour < 21:
        session = "New York"
        volatility = "Tinggi"
        warning = "Sesi New York. Hati-hati berita AS."
    elif 0 <= hour < 8:
        session = "Asia (Tokyo)"
        volatility = "Rendah"
        warning = "Sesi Asia cenderung ranging. Sinyal tren sering palsu."
    else:
        session = "Transisi / Lambat"
        volatility = "Rendah"
        warning = "Volume rendah, pasar cenderung sepi."

    return {
        "session": session,
        "volatility": volatility,
        "warning": warning,
        "time_utc": now.strftime("%H:%M UTC")
    }
