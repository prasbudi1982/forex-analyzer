from app.analysis import scorer
from app.fundamentals.news_filter import is_blackout
from datetime import datetime

def decide(technical_signals, calendar_events, now):
    score = 0
    for s in technical_signals:
        # Bobot dasar
        weight = 1
        # Jika setup memiliki konfluensi (searah tren besar), gandakan bobotnya
        if s.get("confluence") == True:
            weight = 2
        
        if s.get("dir") == "bull":
            score += weight
        elif s.get("dir") == "bear":
            score -= weight

    # Cek berita
    blocked, ev = is_blackout(calendar_events, now, window_min=30)
    
    reasons = [f"Skor Konfluensi: {score}"]
    if blocked:
        reasons.append(f"⛔ BLACKOUT: Berita {ev.get('title')}")
    
    confidence = min(abs(score) / 6, 1.0) # Skala disesuaikan karena bobot bisa 2x
    
    if blocked:
        confidence = confidence * 0.5
        
    return {
        "direction": "bull" if score > 0 else "bear" if score < 0 else "neutral",
        "confidence": confidence,
        "blocked": blocked,
        "reasons": reasons,
    }
