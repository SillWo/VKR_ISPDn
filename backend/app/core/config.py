import os
from functools import lru_cache

from pydantic import BaseModel, Field

LOCAL_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/vkr_ispdn"


class Settings(BaseModel):
    database_url: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", LOCAL_DATABASE_URL))


@lru_cache
def get_settings() -> Settings:
    return Settings()
