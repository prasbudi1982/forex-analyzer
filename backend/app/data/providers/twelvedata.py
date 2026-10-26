import httpx
import pandas as pd
from .base import DataProvider
from app.core.settings import settings

class TwelveDataProvider(DataProvider):
    BASE = "https://api.twelvedata.com/time_series"

    def get_ohlc(self, symbol, timeframe="1h", start=None, end=None, limit=500):
        params = {
            "symbol": symbol,
            "interval": timeframe,
            "outputsize": limit,
            "apikey": settings.TWELVEDATA_API_KEY,
            "format": "JSON",
        }
        r = httpx.get(self.BASE, params=params, timeout=30)
        r.raise_for_status()
        data = r.json().get("values", [])
        df = pd.DataFrame(data)
        if df.empty:
            return df
        df["datetime"] = pd.to_datetime(df["datetime"])
        df = df.sort_values("datetime").reset_index(drop=True)
        for c in ["open", "high", "low", "close"]:
            df[c] = df[c].astype(float)
        return df[["datetime", "open", "high", "low", "close"]]
