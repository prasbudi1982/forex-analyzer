import os
from pydantic_settings import BaseSettings

# Dapatkan path absolut ke folder backend (dua level di atas folder core)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_FILE_PATH = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    APP_NAME: str = "forex-analyzer"
    CORS_ORIGINS: list[str] = ["*"]
    DATA_DIR: str = "./data/ohlc"
    TWELVEDATA_API_KEY: str = ""
    OANDA_API_KEY: str = ""
    OANDA_ACCOUNT_ID: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = "" # <-- Pastikan ini ada

    class Config:
        # Arahkan Pydantic ke path absolut file .env
        env_file = ENV_FILE_PATH
        env_file_encoding = 'utf-8'
        extra = "ignore"

settings = Settings()
