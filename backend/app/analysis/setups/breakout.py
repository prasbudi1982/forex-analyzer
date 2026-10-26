def detect(df, level):
    last = df.iloc[-1]
    prev = df.iloc[-2]
    if prev.close < level <= last.close:
        return {"setup": "breakout", "dir": "bull", "level": level}
    if prev.close > level >= last.close:
        return {"setup": "breakout", "dir": "bear", "level": level}
    return None
