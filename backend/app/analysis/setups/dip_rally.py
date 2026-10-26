from app.indicators.trend import ema
from app.indicators.momentum import rsi

def detect(df):
    results = []
    # Cek apakah data cukup untuk indikator
    if len(df) < 50:
        return results

    # Hitung indikator menggunakan data yang diberikan (limit 300 dari endpoint)
    ema50 = ema(df, 50)
    rsi14 = rsi(df, 14)
    
    last_close = df['close'].iloc[-1]
    last_ema = ema50.iloc[-1]
    last_rsi = rsi14.iloc[-1]

    # Buy on Dip: Tren naik (Close > EMA50) tapi RSI Oversold (< 45)
    if last_close > last_ema and last_rsi < 45:
        results.append({
            "setup": "buy_on_dip", 
            "dir": "bull", 
            "level": round(last_close, 5),
            "reason": f"Harga di atas EMA50, RSI Oversold ({round(last_rsi, 1)})"
        })

    # Sell on Rally: Tren turun (Close < EMA50) tapi RSI Overbought (> 55)
    if last_close < last_ema and last_rsi > 55:
        results.append({
            "setup": "sell_on_rally", 
            "dir": "bear", 
            "level": round(last_close, 5),
            "reason": f"Harga di bawah EMA50, RSI Overbought ({round(last_rsi, 1)})"
        })

    return results
