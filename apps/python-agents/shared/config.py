"""
Configuration management for Python agents service.
Loads environment variables and provides typed configuration.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Service configuration
    service_name: str = "python-agents"
    service_port: int = 3001
    environment: str = os.getenv("ENVIRONMENT", "development")

    # API Keys
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")

    # Mock mode configuration
    use_mock_responses: bool = os.getenv("USE_MOCK_RESPONSES", "false").lower() == "true"

    # External service URLs
    typescript_agents_url: str = os.getenv("TYPESCRIPT_AGENTS_URL", "http://typescript-agents:3002")
    hotel_api_url: str = os.getenv("HOTEL_API_URL", "https://api.hotels.com")
    transport_api_url: str = os.getenv("TRANSPORT_API_URL", "https://api.transport.com")

    # LangChain configuration
    langchain_tracing_v2: bool = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
    langchain_api_key: Optional[str] = os.getenv("LANGCHAIN_API_KEY")
    langchain_project: str = os.getenv("LANGCHAIN_PROJECT", "allorai-python-agents")

    # Model configuration
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")
    temperature: float = float(os.getenv("TEMPERATURE", "0.7"))

    class Config:
        case_sensitive = False
        env_file = ".env"


# Global settings instance
settings = Settings()
