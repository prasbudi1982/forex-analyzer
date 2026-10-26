import pandas as pd

def validate_ohlc(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    df = df.drop_duplicates(subset=["datetime"]).sort_values("datetime")
    df = df[df["high"] >= df["low"]]
    df = df[df["high"] >= df[["open", "close"]].max(axis=1)]
    df = df[df["low"] <= df[["open", "close"]].min(axis=1)]
    return df.reset_index(drop=True)
