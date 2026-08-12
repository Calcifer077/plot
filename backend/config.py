import redis.asyncio as redis
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

@lru_cache
def get_redis_client() -> redis.Redis:
    return redis.Redis(host='localhost', port=6379, decode_responses=False)


class Settings(BaseSettings):
    """
    This class is used to manage application settings, including the list of allowed frontend URLs for CORS configuration. The settings are loaded from a .env file, and the FRONTEND_URLS environment variable should contain a comma-separated list of allowed origins.
    The frontend_urls_list property returns a list of allowed origins by splitting the FRONTEND_URLS string and stripping any whitespace. This is useful for configuring CORS middleware in FastAPI applications.
    Example .env file:
    FRONTEND_URLS="http://localhost:5173,http://your-domain.com"
    """
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    FRONTEND_URLS: str  # comma-separated list of allowed origins

    @property
    def frontend_urls_list(self) -> list[str]:
        return [url.strip() for url in self.FRONTEND_URLS.split(",") if url.strip()]

@lru_cache
def get_settings():
    """
    'lru_cache' is used to cache the settings instance, ensuring that the settings are only loaded once and reused throughout the application. This improves performance and avoids unnecessary reloading of environment variables.
    """
    return Settings()