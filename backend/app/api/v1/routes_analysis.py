from fastapi import APIRouter
from app.data.repository import get_ohlc
from app.analysis.candle_patterns import scanner as pat_scanner
from app.analysis.levels import scanner as lvl_scanner
from app.analysis.setups import scanner as setup_scanner
from app.analysis.setups.scanner import get_htf_trend

router = APIRouter()

def get_htf_timeframe(tf: str):
    # Menentukan timeframe besar (HTF) berdasarkan TF kecil (LTF)
    if tf == '15min': return '4h'
    if tf == '1h': return '4h'
    if tf == '4h': return '1day'
    return '1day'

@router.get("/candles")
def candles(symbol: str = "EUR/USD", tf: str = "1h"):
    df = get_ohlc(symbol, tf, limit=300)
    return pat_scanner.scan(df)

@router.get("/levels")
def levels(symbol: str = "EUR/USD", tf: str = "1h"):
    df = get_ohlc(symbol, tf, limit=300)
    return lvl_scanner.scan(df)

@router.get("/setups")
def setups(symbol: str = "EUR/USD", tf: str = "1h"):
    # 1. Ambil data LTF (Timeframe saat ini)
    df = get_ohlc(symbol, tf, limit=300)
    
    # 2. Ambil data HTF (Timeframe besar)
    htf = get_htf_timeframe(tf)
    df_htf = get_ohlc(symbol, htf, limit=100) # Cukup 100 untuk EMA 50
    
    # 3. Tentukan tren HTF
    htf_trend = get_htf_trend(df_htf)
    
    lv = lvl_scanner.scan(df)
    return setup_scanner.scan(df, lv, htf_trend)
