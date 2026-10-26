from fastapi import APIRouter, Query
from app.data.repository import get_ohlc
from app.data.validator import validate_ohlc

router = APIRouter()

@router.get("/ohlc")
def ohlc(symbol: str = "EUR/USD", tf: str = "1h", limit: int = Query(500, le=5000)):
    df = get_ohlc(symbol, tf, limit=limit)
    df = validate_ohlc(df)
    return df.to_dict(orient="records")
