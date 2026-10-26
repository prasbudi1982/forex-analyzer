from fastapi import APIRouter, Query
from app.analysis.correlation import calculate_correlation

router = APIRouter()

@router.get("")
def correlation(symbols: str = Query(..., description="Daftar pair dipisah koma, misal: EUR/USD,GBP/USD"), tf: str = "1h"):
    # Ubah string "EUR/USD,GBP/USD" menjadi list ["EUR/USD", "GBP/USD"]
    symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
    return calculate_correlation(symbol_list, tf)
