def swing_levels(df, window=3):
    highs, lows = [], []
    for i in range(window, len(df) - window):
        h = df["high"].iloc[i]
        l = df["low"].iloc[i]
        if h == df["high"].iloc[i-window:i+window+1].max():
            highs.append(h)
        if l == df["low"].iloc[i-window:i+window+1].min():
            lows.append(l)
    return {"resistance": highs, "support": lows}
