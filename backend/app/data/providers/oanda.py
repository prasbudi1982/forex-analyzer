import httpx
import pandas as pd
from .base import DataProvider
from app.core.settings import settings

class OandaProvider(DataProvider):
    BASE = "https://api-fxpractice.oanda.com/v3"

    def get_ohlc(self, symbol, timeframe="H1", start=None, end=None, limit=500):
        headers = {"Authorization": f"Bearer {settings.OANDA_API_KEY}"}
        url = f"{self.BASE}/instruments/{symbol}/candles"
        params = {"granularity": timeframe, "count": limit, "price": "M"}
        r = httpx.get(url, headers=headers, params=params, timeout=30)
        r.raise_for_status()
        rows = []
        for c in r.json().get("candles", []):
            m = c["mid"]
            rows.append({
                "datetime": c["time"],
                "open": float(m["o"]), "high": float(m["h"]),
                "low": float(m["l"]), "close": float(m["c"]),
            })
        df = pd.DataFrame(rows)
        if not df.empty:
            df["datetime"] = pd.to_datetime(df["datetime"])
        return df
