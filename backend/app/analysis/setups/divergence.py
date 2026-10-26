from app.indicators.momentum import rsi

def detect(df, lookback=30):
    results = []
    if len(df) < lookback + 15:
        return results

    # Hitung RSI
    rsi_series = rsi(df, 14)
    
    # Ambil data terakhir sebanyak 'lookback' untuk mencari peak/valley
    recent_df = df.iloc[-lookback:].copy()
    recent_rsi = rsi_series.iloc[-lookback:]

    # Cari 2 titik terakhir (High/Low) menggunakan window sederhana (5 candle)
    window = 5
    
    # 1. Cari Puncak Harga & Puncak RSI (Bearish Divergence)
    price_highs = []
    rsi_highs = []
    for i in range(window, len(recent_df) - window):
        is_high = recent_df['high'].iloc[i] == recent_df['high'].iloc[i-window:i+window+1].max()
        if is_high:
            price_highs.append((i, recent_df['high'].iloc[i], recent_rsi.iloc[i]))
    
    if len(price_highs) >= 2:
        last_high = price_highs[-1]
        prev_high = price_highs[-2]
        # Harga Higher High, RSI Lower High
        if last_high[1] > prev_high[1] and last_high[2] < prev_high[2]:
            results.append({
                "setup": "bearish_divergence",
                "dir": "bear",
                "reason": f"HH di Harga ({round(prev_high[1],5)}->{round(last_high[1],5)}), LH di RSI ({round(prev_high[2],1)}->{round(last_high[2],1)})"
            })

    # 2. Cari Lembah Harga & Lembah RSI (Bullish Divergence)
    price_lows = []
    rsi_lows = []
    for i in range(window, len(recent_df) - window):
        is_low = recent_df['low'].iloc[i] == recent_df['low'].iloc[i-window:i+window+1].min()
        if is_low:
            price_lows.append((i, recent_df['low'].iloc[i], recent_rsi.iloc[i]))
            
    if len(price_lows) >= 2:
        last_low = price_lows[-1]
        prev_low = price_lows[-2]
        # Harga Lower Low, RSI Higher Low
        if last_low[1] < prev_low[1] and last_low[2] > prev_low[2]:
            results.append({
                "setup": "bullish_divergence",
                "dir": "bull",
                "reason": f"LL di Harga ({round(prev_low[1],5)}->{round(last_low[1],5)}), HL di RSI ({round(prev_low[2],1)}->{round(last_low[2],1)})"
            })

    return results
