from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


# Explicit absolute path to backend/.env relative to this config file
_BACKEND_DIR = Path(__file__).resolve().parent.parent  # backend/
_BACKEND_ENV_PATH = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Google Gemini API Settings (gemini-3.5-flash-lite is the designated high-quota 15 RPM / 1,500 RPD model)
    GOOGLE_API_KEY: str = "YOUR_GEMINI_API_KEY"
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    # Throttled Map-Reduce Settings (Safe for Free-Tier: 15 RPM / 1,500 RPD)
    # 5 micro-batches of 2 personas = 10 calls + 1 analyst call = 11 calls per simulation.
    # 1,500 RPD / 11 calls = 136 max simulations per day.
    # Cap daily simulations at 120 (reserving 176 requests for backoff retries and safety buffer).
    BATCH_SIZE: int = 2
    BATCH_SLEEP_SECONDS: int = 13
    MAX_DAILY_SIMULATIONS: int = 120
    MAX_RETRIES: int = 3
    INITIAL_BACKOFF_SECONDS: float = 4.0

    # Guardrails & Rate Limits
    MAX_BRIEF_LENGTH: int = 5000
    MIN_BRIEF_LENGTH: int = 10
    RATE_LIMIT_SIMULATIONS_PER_HOUR: int = 10
    TRUSTED_PROXY_HOPS: int = 1

    # CORS Origins (comma-separated origins; defaults to local development origins)
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
