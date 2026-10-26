import pandas as pd
from .base import DataProvider

class DukascopyProvider(DataProvider):
    def get_ohlc(self, symbol, timeframe="1h", start=None, end=None, limit=500):
        raise NotImplementedError("Integrasikan dukascopy-python atau file Parquet lokal.")
