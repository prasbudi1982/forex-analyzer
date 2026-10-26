import os, zipfile

ROOT = "forex-analyzer"

# Struktur folder saja (file kosong)
DIRS = [
    "backend/app/core",
    "backend/app/data/providers",
    "backend/app/indicators",
    "backend/app/analysis/candle_patterns",
    "backend/app/analysis/levels",
    "backend/app/analysis/setups",
    "backend/app/fundamentals",
    "backend/app/decision",
    "backend/app/api/v1",
    "backend/app/websocket",
    "backend/tests",
    "frontend/src/app/chart",
    "frontend/src/app/scanner",
    "frontend/src/app/calendar",
    "frontend/src/app/settings",
    "frontend/src/components/chart",
    "frontend/src/components/scanner",
    "frontend/src/components/fundamental",
    "frontend/src/lib",
    "frontend/src/hooks",
    "data/ohlc",
    "scripts",
]

FILES = {
    # ---- BACKEND INTI ----
    "backend/requirements.txt": (
        "fastapi==0.115.0\n"
        "uvicorn[standard]==0.30.6\n"
        "pandas==2.2.2\n"
        "numpy==1.26.4\n"
        "pydantic==2.8.2\n"
        "pydantic-settings==2.4.0\n"
        "httpx==0.27.0\n"
        "apscheduler==3.10.4\n"
        "python-dotenv==1.0.1\n"
        "pyarrow==17.0.0\n"
        "redis==5.0.8\n"
    ),

    "backend/main.py": (
        "from fastapi import FastAPI\n"
        "from fastapi.middleware.cors import CORSMiddleware\n"
        "from app.api.v1.router import api_router\n"
        "from app.core.settings import settings\n"
        "\n"
        "app = FastAPI(title='Forex Analyzer API', version='0.1.0')\n"
        "app.add_middleware(\n"
        "    CORSMiddleware,\n"
        "    allow_origins=settings.CORS_ORIGINS,\n"
        "    allow_credentials=True,\n"
        "    allow_methods=['*'],\n"
        "    allow_headers=['*'],\n"
        ")\n"
        "app.include_router(api_router, prefix='/api/v1')\n"
        "\n"
        "@app.get('/health')\n"
        "def health():\n"
        "    return {'status': 'ok'}\n"
    ),

    "backend/app/core/settings.py": (
        "from pydantic_settings import BaseSettings\n"
        "\n"
        "class Settings(BaseSettings):\n"
        "    APP_NAME: str = 'forex-analyzer'\n"
        "    CORS_ORIGINS: list[str] = ['http://localhost:3000']\n"
        "    DATA_DIR: str = './data/ohlc'\n"
        "    TWELVEDATA_API_KEY: str = ''\n"
        "    OANDA_API_KEY: str = ''\n"
        "    OANDA_ACCOUNT_ID: str = ''\n"
        "    REDIS_URL: str = 'redis://localhost:6379/0'\n"
        "\n"
        "    class Config:\n"
        "        env_file = '.env'\n"
        "\n"
        "settings = Settings()\n"
    ),

    "backend/app/data/providers/base.py": (
        "from abc import ABC, abstractmethod\n"
        "import pandas as pd\n"
        "\n"
        "class DataProvider(ABC):\n"
        "    @abstractmethod\n"
        "    def get_ohlc(self, symbol, timeframe='1h', start=None, end=None, limit=500):\n"
        "        ...\n"
    ),

    "backend/app/data/providers/twelvedata.py": (
        "import httpx\n"
        "import pandas as pd\n"
        "from .base import DataProvider\n"
        "from app.core.settings import settings\n"
        "\n"
        "class TwelveDataProvider(DataProvider):\n"
        "    BASE = 'https://api.twelvedata.com/time_series'\n"
        "\n"
        "    def get_ohlc(self, symbol, timeframe='1h', start=None, end=None, limit=500):\n"
        "        params = {'symbol': symbol, 'interval': timeframe,\n"
        "                  'outputsize': limit, 'apikey': settings.TWELVEDATA_API_KEY}\n"
        "        r = httpx.get(self.BASE, params=params, timeout=30)\n"
        "        r.raise_for_status()\n"
        "        df = pd.DataFrame(r.json().get('values', []))\n"
        "        if df.empty:\n"
        "            return df\n"
        "        df['datetime'] = pd.to_datetime(df['datetime'])\n"
        "        df = df.sort_values('datetime').reset_index(drop=True)\n"
        "        for c in ['open','high','low','close']:\n"
        "            df[c] = df[c].astype(float)\n"
        "        return df[['datetime','open','high','low','close']]\n"
    ),

    "backend/app/data/repository.py": (
        "from app.data.providers.twelvedata import TwelveDataProvider\n"
        "\n"
        "_provider = TwelveDataProvider()\n"
        "\n"
        "def get_ohlc(symbol, timeframe='1h', limit=500):\n"
        "    return _provider.get_ohlc(symbol, timeframe, limit=limit)\n"
    ),

    "backend/app/data/validator.py": (
        "import pandas as pd\n"
        "\n"
        "def validate_ohlc(df: pd.DataFrame) -> pd.DataFrame:\n"
        "    if df.empty:\n"
        "        return df\n"
        "    df = df.drop_duplicates(subset=['datetime']).sort_values('datetime')\n"
        "    df = df[df['high'] >= df['low']]\n"
        "    return df.reset_index(drop=True)\n"
    ),

    # ---- INDICATORS ----
    "backend/app/indicators/trend.py": (
        "def ema(df, period=20):\n"
        "    return df['close'].ewm(span=period, adjust=False).mean()\n"
        "\n"
        "def sma(df, period=20):\n"
        "    return df['close'].rolling(period).mean()\n"
    ),

    "backend/app/indicators/momentum.py": (
        "def rsi(df, period=14):\n"
        "    delta = df['close'].diff()\n"
        "    gain = delta.clip(lower=0).rolling(period).mean()\n"
        "    loss = (-delta.clip(upper=0)).rolling(period).mean()\n"
        "    rs = gain / loss.replace(0, 1e-9)\n"
        "    return 100 - (100 / (1 + rs))\n"
    ),

    # ---- API ----
    "backend/app/api/v1/router.py": (
        "from fastapi import APIRouter\n"
        "from .routes_market import router as market_router\n"
        "\n"
        "api_router = APIRouter()\n"
        "api_router.include_router(market_router, prefix='/market', tags=['market'])\n"
    ),

    "backend/app/api/v1/routes_market.py": (
        "from fastapi import APIRouter\n"
        "from app.data.repository import get_ohlc\n"
        "from app.data.validator import validate_ohlc\n"
        "\n"
        "router = APIRouter()\n"
        "\n"
        "@router.get('/ohlc')\n"
        "def ohlc(symbol: str = 'EUR/USD', tf: str = '1h', limit: int = 500):\n"
        "    df = get_ohlc(symbol, tf, limit=limit)\n"
        "    df = validate_ohlc(df)\n"
        "    return df.to_dict(orient='records')\n"
    ),

    # ---- ROOT ----
    "README.md": (
        "# Forex Analyzer\n\n"
        "## Backend\n"
        "```\ncd backend\npip install -r requirements.txt\nuvicorn main:app --reload\n```\n\n"
        "## Frontend\n"
        "```\ncd frontend\nnpm install\nnpm run dev\n```\n"
    ),

    ".env.example": (
        "TWELVEDATA_API_KEY=your_key\n"
        "OANDA_API_KEY=your_key\n"
        "OANDA_ACCOUNT_ID=your_id\n"
        "REDIS_URL=redis://localhost:6379/0\n"
    ),
}

# ---------- EXEC ----------
def make():
    for d in DIRS:
        os.makedirs(os.path.join(ROOT, d), exist_ok=True)
    # __init__.py otomatis di setiap package
    for d in DIRS:
        if d.startswith("backend/app") or d.startswith("backend/tests"):
            init = os.path.join(ROOT, d, "__init__.py")
            if not os.path.exists(init):
                open(init, "w").close()
    for path, content in FILES.items():
        full = os.path.join(ROOT, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
    # file .gitkeep
    open(os.path.join(ROOT, "data/ohlc/.gitkeep"), "w").close()

def zipit():
    with zipfile.ZipFile(f"{ROOT}.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for foldername, _, filenames in os.walk(ROOT):
            for fn in filenames:
                full = os.path.join(foldername, fn)
                z.write(full, os.path.relpath(full, ROOT))
    print(f"✅ Done: {ROOT}.zip")

if __name__ == "__main__":
    make()
    zipit()