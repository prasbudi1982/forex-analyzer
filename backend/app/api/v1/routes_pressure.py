from fastapi import APIRouter
import httpx
import time
from collections import deque

router = APIRouter()

# Menyimpan riwayat tick di memori (maksimal 50 tick terakhir)
tick_history = deque(maxlen=50)

@router.get("/tick")
async def get_latest_tick(symbol: str = "EURUSD"):
    safe_symbol = symbol.replace("/", "")
    try:
        async with httpx.AsyncClient() as client:
            # Ambil tick real dari Biquote
            r = await client.get(f"https://biquote.io/api/{safe_symbol}", timeout=5.0)
            if r.status_code == 200:
                data = r.json()
                mid = data.get("mid")
                if mid:
                    tick_history.append(mid)
                
                return {
                    "symbol": symbol,
                    "bid": data.get("bid"),
                    "ask": data.get("ask"),
                    "mid": mid,
                    "timestamp": data.get("timestamp"),
                    "history_length": len(tick_history)
                }
    except Exception as e:
        print(f"Gagal ambil tick real: {e}")
    
    # Jika Biquote benar-benar down, kembalikan error (jangan pakai data palsu)
    return {"error": "Gagal mengambil data dari penyedia likuiditas."}

@router.get("")
async def get_pressure(symbol: str = "EUR/USD"):
    """Menghitung tekanan pasar dari riwayat tick real"""
    if len(tick_history) < 2:
        return {
            "symbol": symbol,
            "buy_pressure": 50,
            "sell_pressure": 50,
            "dominant": "NETRAL (Data belum cukup)"
        }

    # Hitung berapa kali harga naik (Buy) dan turun (Sell)
    buys = 0
    sells = 0
    for i in range(1, len(tick_history)):
        if tick_history[i] > tick_history[i-1]:
            buys += 1
        elif tick_history[i] < tick_history[i-1]:
            sells += 1

    total = buys + sells
    if total == 0:
        return {"symbol": symbol, "buy_pressure": 50, "sell_pressure": 50, "dominant": "NETRAL"}

    buy_pct = round((buys / total) * 100, 1)
    sell_pct = round((sells / total) * 100, 1)
    
    return {
        "symbol": symbol,
        "buy_pressure": buy_pct,
        "sell_pressure": sell_pct,
        "dominant": "BUYERS" if buy_pct > sell_pct else "SELLERS"
    }
