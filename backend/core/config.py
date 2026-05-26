from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    SECRET_KEY: str = "mailsetu-secret"
    DATABASE_URL: str = "sqlite+aiosqlite:///./database/mailsetu.db"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    RATE_LIMIT_PER_MINUTE: int = 20
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 2
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
