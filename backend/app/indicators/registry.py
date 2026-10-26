from .trend import ema, sma, macd
from .momentum import rsi
from .volatility import atr, bollinger_bands

REGISTRY = {
    "EMA": ema,
    "SMA": sma,
    "MACD": macd,
    "RSI": rsi,
    "ATR": atr,
    "BB": bollinger_bands,
}
