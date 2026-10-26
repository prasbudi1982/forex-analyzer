import pandas as pd
from app.indicators.volatility import bollinger_bands

def detect(df):
    results = []
    if len(df) < 30:
        return results

    # Hitung Bollinger Bands
    upper, middle, lower = bollinger_bands(df, 20, 2)
    
    # Ambil data 5 candle terakhir untuk evaluasi
    recent_df = df.iloc[-5:]
    recent_upper = upper.iloc[-5:]
    recent_lower = lower.iloc[-5:]
    
    # 1. Cek Kompresi (Band Width sempit) di 3 candle sebelumnya
    # Band Width = (Upper - Lower) / Middle
    bandwidth = (recent_upper - recent_lower) / middle.iloc[-5:]
    is_squeeze = bandwidth.iloc[:3].mean() < bandwidth.iloc[-5:].mean() * 0.8 # Bandwidth mengecil 20%

    # 2. Cek Ekspansi (Candle terakhir menembus Band dengan body besar)
    last_candle = df.iloc[-1]
    last_upper = upper.iloc[-1]
    last_lower = lower.iloc[-1]
    
    body_size = abs(last_candle['close'] - last_candle['open'])
    candle_range = last_candle['high'] - last_candle['low']
    atr = (df['high'] - df['low']).rolling(14).mean().iloc[-1]
    
    # Candle dianggap "meledak" jika body-nya > 1.2x ATR
    is_explosive = body_size > (atr * 1.2)

    if is_explosive:
        # Bullish Expansion
        if last_candle['close'] > last_upper and last_candle['close'] > last_candle['open']:
            results.append({
                "setup": "market_expansion",
                "dir": "bull",
                "reason": "Harga meledak menembus Upper BB dengan body candle besar (Ekspansi Volatilitas)."
            })
        # Bearish Expansion
        elif last_candle['close'] < last_lower and last_candle['close'] < last_candle['open']:
            results.append({
                "setup": "market_expansion",
                "dir": "bear",
                "reason": "Harga meledak menembus Lower BB dengan body candle besar (Ekspansi Volatilitas)."
            })
            
    return results
