import pandas as pd
import httpx
from app.data.providers.biquote import BiquoteProvider
from app.data.providers.twelvedata import TwelveDataProvider
from app.data import cache
from app.data import storage

_providers = [BiquoteProvider(), TwelveDataProvider()]

def get_ohlc(symbol: str, timeframe: str = "1h", limit: int = 500) -> pd.DataFrame:
    cache_key = f"ohlc_{symbol}_{timeframe}"
    
    cached_df = cache.get(cache_key)
    if cached_df is not None:
        return cached_df.tail(limit).reset_index(drop=True)

    local_df = storage.load_local_ohlc(symbol, timeframe)
    if not local_df.empty:
        try:
            local_df["datetime"] = pd.to_datetime(local_df["datetime"])
            fetch_limit = 20 if len(local_df) >= 100 else 500
        except:
            local_df = pd.DataFrame()
            fetch_limit = 500
    else:
        fetch_limit = 500

    new_df = pd.DataFrame()
    
    for i, provider in enumerate(_providers):
        try:
            new_df = provider.get_ohlc(symbol, timeframe, limit=fetch_limit)
            if not new_df.empty:
                new_df = new_df[["datetime", "open", "high", "low", "close"]].copy()
                new_df["datetime"] = pd.to_datetime(new_df["datetime"])
                break
        except Exception as e:
            if i == len(_providers) - 1:
                if not local_df.empty:
                    return local_df.tail(limit).reset_index(drop=True)
                raise Exception(f"Semua provider gagal: {e}")
            continue

    if new_df.empty:
        raise Exception("Tidak ada data dari provider.")

    if not local_df.empty:
        try:
            local_df = local_df[["datetime", "open", "high", "low", "close"]].copy()
            local_df["datetime"] = pd.to_datetime(local_df["datetime"])
            combined_df = pd.concat([local_df, new_df])
            combined_df = combined_df.drop_duplicates(subset=["datetime"]).sort_values("datetime").tail(500).reset_index(drop=True)
        except:
            combined_df = new_df
    else:
        combined_df = new_df

    try:
        storage.save_local_ohlc(combined_df, symbol, timeframe)
    except Exception as e:
        print(f"Gagal simpan parquet: {e}")
        
    cache.set(cache_key, combined_df, ttl_seconds=300)

    return combined_df.tail(limit).reset_index(drop=True)
