from fastapi import APIRouter
from datetime import datetime
from app.data.repository import get_ohlc
from app.analysis.candle_patterns import scanner as pat_scanner
from app.analysis.levels import scanner as lvl_scanner
from app.analysis.setups import scanner as setup_scanner
from app.fundamentals.economic_calendar import fetch_calendar
from app.decision.engine import decide

router = APIRouter()

@router.get("/recommendation")
def recommendation(symbol: str = "EUR/USD", tf: str = "1h"):
    df = get_ohlc(symbol, tf)
    lv = lvl_scanner.scan(df)
    setups = setup_scanner.scan(df, lv)
    pats = pat_scanner.scan(df)
    signals = setups + [{"dir": p["dir"]} for p in pats]
    cal = fetch_calendar(datetime.utcnow(), datetime.utcnow(), "high")
    return decide(signals, cal, datetime.utcnow())
