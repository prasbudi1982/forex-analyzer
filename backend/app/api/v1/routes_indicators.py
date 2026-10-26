from fastapi import APIRouter, Query
from app.data.repository import get_ohlc
from app.indicators.registry import REGISTRY
import math

router = APIRouter()

def clean_float(val):
    if val is None or math.isnan(val) or math.isinf(val):
        return None
    return round(float(val), 5)

@router.get("")
def indicators(symbol: str = "EUR/USD", tf: str = "1h", names: str = Query("EMA,RSI")):
    df = get_ohlc(symbol, tf)
    out = {}
    
    for name in [n.strip() for n in names.split(",") if n.strip()]:
        fn = REGISTRY.get(name)
        if fn:
            try:
                res = fn(df)
                
                # KHUSUS BOLLINGER BANDS: Kembalikan sebagai objek, bukan array
                if name == "BB" and isinstance(res, tuple):
                    out[name] = {
                        "upper": [clean_float(x) for x in res[0].tolist()],
                        "middle": [clean_float(x) for x in res[1].tolist()],
                        "lower": [clean_float(x) for x in res[2].tolist()]
                    }
                # KHUSUS MACD (jika nanti dipakai)
                elif name == "MACD" and isinstance(res, tuple):
                    out[name] = {
                        "macd": [clean_float(x) for x in res[0].tolist()],
                        "signal": [clean_float(x) for x in res[1].tolist()],
                        "hist": [clean_float(x) for x in res[2].tolist()]
                    }
                # Untuk indikator tunggal (EMA, RSI, dll)
                elif isinstance(res, tuple):
                    out[name] = [[clean_float(x) for x in r] for r in res]
                else:
                    out[name] = [clean_float(x) for x in res.tolist()]
            except Exception as e:
                out[name] = []
                print(f"Error menghitung {name}: {e}")
    return out
