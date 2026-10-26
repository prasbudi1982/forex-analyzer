import httpx
import pandas as pd
from .base import DataProvider

class BiquoteProvider(DataProvider):
    BASE = "https://biquote.io/api"

    def get_ohlc(self, symbol: str, timeframe: str = "1h", start=None, end=None, limit=500):
        # Biquote menggunakan format simbol tanpa garis miring (EURUSD)
        safe_symbol = symbol.replace("/", "")
        
        # Konversi timeframe ke format Biquote
        tf_map = {"15min": "15m", "1h": "1h", "4h": "4h", "1day": "1d"}
        interval = tf_map.get(timeframe, "1h")

        url = f"{self.BASE}/{safe_symbol}/ohlc"
        params = {
            "interval": interval,
            "limit": limit
        }

        r = httpx.get(url, params=params, timeout=30)
        r.raise_for_status()
        data = r.json()
        
        # Ambil array bars dari envelope
        bars = data.get("bars", [])
        if not bars:
            return pd.DataFrame()

        df = pd.DataFrame(bars)
        
        # Rename kolom openTime -> datetime
        df = df.rename(columns={"openTime": "datetime"})
        df["datetime"] = pd.to_datetime(df["datetime"])
        
        # Biquote mengembalikan data terbaru dulu, kita urutkan dari terlama
        df = df.sort_values("datetime").reset_index(drop=True)
        
        return df[["datetime", "open", "high", "low", "close"]]
