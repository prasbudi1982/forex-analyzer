def combine(signals):
    score = 0
    for s in signals:
        direction = s.get("dir")
        if direction == "bull":
            score += 1
        elif direction == "bear":
            score -= 1
    return {
        "score": score,
        "bias": "bull" if score > 0 else "bear" if score < 0 else "neutral",
    }
