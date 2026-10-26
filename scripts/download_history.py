import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.data.repository import get_ohlc
from app.data.storage import save_parquet

if __name__ == "__main__":
    df = get_ohlc("EUR/USD", "1h", limit=5000)
    save_parquet(df, "EURUSD", "1h")
    print(f"Saved {len(df)} rows")
