def doji(o, h, l, c, body_ratio=0.1):
    rng = h - l
    if rng == 0:
        return False
    return abs(c - o) / rng <= body_ratio

def hammer(o, h, l, c):
    body = abs(c - o)
    lower = min(o, c) - l
    upper = h - max(o, c)
    return lower >= 2 * body and upper <= body

def shooting_star(o, h, l, c):
    body = abs(c - o)
    upper = h - max(o, c)
    lower = min(o, c) - l
    return upper >= 2 * body and lower <= body
