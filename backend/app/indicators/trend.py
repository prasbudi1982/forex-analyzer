import pandas as pd

def ema(df: pd.DataFrame, period: int = 20) -> pd.Series:
    return df["close"].ewm(span=period, adjust=False).mean()

def sma(df: pd.DataFrame, period: int = 20) -> pd.Series:
    return df["close"].rolling(period).mean()

def macd(df: pd.DataFrame, fast=12, slow=26, signal=9):
    ema_fast = df["close"].ewm(span=fast, adjust=False).mean()
    ema_slow = df["close"].ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    hist = macd_line - signal_line
    return macd_line, signal_line, hist
