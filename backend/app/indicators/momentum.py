import pandas as pd

def rsi(df: pd.DataFrame, period: int = 14) -> pd.Series:
    delta = df["close"].diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    
    # Hindari division by zero (loss = 0) dengan mengganti 0 menjadi 1e-9
    rs = gain / loss.replace(0, 1e-9)
    rsi_series = 100 - (100 / (1 + rs))
    
    # Jika loss aslinya 0, RSI harusnya 100
    rsi_series[loss == 0] = 100
    return rsi_series
