from .single import hammer, shooting_star
from .double import bullish_engulfing, bearish_engulfing
import pandas as pd

def scan(df):
    signals = []
    if 'datetime' in df.columns:
        df['time_iso'] = pd.to_datetime(df['datetime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
    else:
        df['time_iso'] = ""

    for i in range(1, len(df)):
        row = df.iloc[i]
        prev = df.iloc[i - 1]
        t_iso = df['time_iso'].iloc[i]
        
        if hammer(row.open, row.high, row.low, row.close):
            signals.append({"i": i, "time_iso": t_iso, "pattern": "hammer", "dir": "bull"})
        if shooting_star(row.open, row.high, row.low, row.close):
            signals.append({"i": i, "time_iso": t_iso, "pattern": "shooting_star", "dir": "bear"})
        if bullish_engulfing((prev.open, prev.close), (row.open, row.close)):
            signals.append({"i": i, "time_iso": t_iso, "pattern": "bullish_engulfing", "dir": "bull"})
        if bearish_engulfing((prev.open, prev.close), (row.open, row.close)):
            signals.append({"i": i, "time_iso": t_iso, "pattern": "bearish_engulfing", "dir": "bear"})
    return signals
