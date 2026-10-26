import os
import pandas as pd
from app.core.settings import settings

def get_filepath(symbol: str, timeframe: str) -> str:
    # Bersihkan simbol (misal EUR/USD jadi EURUSD)
    safe_symbol = symbol.replace("/", "").replace("\\", "")
    folder = os.path.join(settings.DATA_DIR, safe_symbol)
    os.makedirs(folder, exist_ok=True)
    return os.path.join(folder, f"{timeframe}.parquet")

def load_local_ohlc(symbol: str, timeframe: str) -> pd.DataFrame:
    path = get_filepath(symbol, timeframe)
    if os.path.exists(path):
        try:
            return pd.read_parquet(path)
        except Exception as e:
            print(f"[ERROR LOAD PARQUET] Gagal membaca file {path}: {e}")
            return pd.DataFrame()
    return pd.DataFrame()

def save_local_ohlc(df: pd.DataFrame, symbol: str, timeframe: str):
    if df.empty:
        return
    path = get_filepath(symbol, timeframe)
    try:
        df.to_parquet(path, index=False)
    except Exception as e:
        print(f"[ERROR SAVE PARQUET] Gagal menyimpan file {path}: {e}")
