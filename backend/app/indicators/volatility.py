import pandas as pd

def atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    tr = pd.concat([
        df["high"] - df["low"],
        (df["high"] - df["close"].shift()).abs(),
        (df["low"] - df["close"].shift()).abs(),
    ], axis=1).max(axis=1)
    return tr.rolling(period).mean()

def bollinger_bands(df: pd.DataFrame, period: int = 20, std_dev: int = 2):
    sma = df["close"].rolling(window=period).mean()
    std = df["close"].rolling(window=period).std()
    
    upper_band = sma + (std * std_dev)
    lower_band = sma - (std * std_dev)
    
    # Mengembalikan tuple (Upper, Middle, Lower)
    return upper_band, sma, lower_band
