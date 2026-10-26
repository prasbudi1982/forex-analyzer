import pandas as pd
from app.indicators.trend import ema

def test_ema_runs():
    df = pd.DataFrame({"close": list(range(50))})
    assert len(ema(df, 10)) == 50
