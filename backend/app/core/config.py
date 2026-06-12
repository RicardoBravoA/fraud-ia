"""Application configuration via environment variables."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo root: backend/app/core -> reto/
REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = REPO_ROOT / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    mongodb_uri: str = "mongodb://localhost:27017/fraud_detection"
    mongodb_db_name: str = "fraud_detection"

    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment: str = "gpt-4o"
    azure_openai_api_version: str = "2024-02-15-preview"

    web_search_mock: bool = True
    web_search_allowed_domains: str = "reuters.com,bleepingcomputer.com"

    # LLM: mock (tests) | ollama (local) | azure (cloud)
    llm_mock: bool = True
    llm_provider: str = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:7b-instruct"
    llm_timeout_seconds: float = 120.0
    llm_max_retries: int = 2

    # Minimum risk score (0–1) to queue HITL review alongside ESCALATE_TO_HUMAN
    hitl_confidence_threshold: float = 0.5
    seed_on_startup: bool = False
    cors_origins: str = "http://localhost:5173"

    log_level: str = "INFO"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
