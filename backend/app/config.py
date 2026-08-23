"""Application configuration with environment variable support."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Central configuration for Recovery AI."""

    # App
    APP_NAME: str = "Recovery AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/recovery_ai.db"

    # Razorpay (test-mode)
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    RAZORPAY_SIMULATION_MODE: bool = True  # Falls back to simulation if no keys

    # LLM (for diagnosis reasoning)
    OPENAI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_ENABLED: bool = False  # Rule-based only by default

    # Synthetic data defaults
    DEFAULT_BATCH_SIZE: int = 300
    MIN_BATCH_SIZE: int = 150
    MAX_BATCH_SIZE: int = 500

    # Stopping rules (hard-coded, non-optional)
    MAX_RETRY_ATTEMPTS: int = 3
    COOLDOWN_MINUTES: int = 30
    AUTO_EXCEPTION_DAYS: int = 7
    AUTO_EXCEPTION_AMOUNT_THRESHOLD: float = 500.0  # ₹
    MAX_DISCOUNT_PERCENT: float = 5.0
    NO_CONTACT_START_HOUR: int = 21  # 9 PM
    NO_CONTACT_END_HOUR: int = 9    # 9 AM

    # Human-in-the-loop threshold
    HITL_AMOUNT_THRESHOLD: float = 50000.0  # ₹50,000+ requires human approval

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
