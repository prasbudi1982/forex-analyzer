from abc import ABC, abstractmethod
import pandas as pd

class DataProvider(ABC):
    @abstractmethod
    def get_ohlc(self, symbol: str, timeframe: str = "1h",
                 start: str | None = None, end: str | None = None,
                 limit: int = 500) -> pd.DataFrame:
        ...
