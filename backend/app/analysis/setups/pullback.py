def detect(df, ema_series):
    if len(df) < 2:
        return None
    last, prev = df.iloc[-1], df.iloc[-2]
    ema_now = ema_series.iloc[-1]
    if prev.close > ema_now and last.close < ema_now and last.close > last.open:
        return {"setup": "pullback", "dir": "bull"}
    if prev.close < ema_now and last.close > ema_now and last.close < last.open:
        return {"setup": "pullback", "dir": "bear"}
    return None
