from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "forex-analyzer"
    CORS_ORIGINS: list[str] = ["*"]
    DATA_DIR: str = "./data/ohlc"
    TWELVEDATA_API_KEY: str = ""
    OANDA_API_KEY: str = ""
    OANDA_ACCOUNT_ID: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    GEMINI_API_KEY: str = ""  # <-- Tambahkan baris ini

    class Config:
        env_file = ".env"
        extra = "ignore"      # <-- Tambahkan ini agar tidak crash jika ada variabel lain di .env

settings = Settings()
