"""
Configuration management for Python agents service.

Load priority (highest to lowest):
1. OS environment variables
2. .env file (if exists)
3. Default values defined below
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Use modern pydantic v2 config
    model_config = SettingsConfigDict(
        env_file=".env",           # Load from .env file if it exists
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",            # Ignore extra fields from .env
    )

    # Service configuration
    service_name: str = "python-agents"
    service_port: int = 3001
    environment: str = "development"

    # API Keys
    openai_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None

    # Mock mode configuration
    use_mock_responses: bool = False

    # External service URLs
    typescript_agents_url: str = "http://typescript-agents:3002"
    hotel_api_url: str = "https://api.hotels.com"
    transport_api_url: str = "https://api.transport.com"
    mcp_server_url: str = "http://127.0.0.1:8001/mcp" ##todo configure to have dynamic setup

    # LangChain/LangSmith configuration
    langchain_tracing_v2: bool = False
    langchain_api_key: Optional[str] = None
    langchain_project: str = "allorai-python-agents"
    langsmith_api_key: Optional[str] = None
    langsmith_tracing: bool = False
    langsmith_project: Optional[str] = None
    langsmith_endpoint: Optional[str] = None

    # Model configuration
    openai_model: str = "gpt-4-turbo-preview"
    temperature: float = 0.7


# Global settings instance
settings = Settings()


def configure_langsmith():
    """
    Set LangSmith env vars in os.environ.

    LangSmith SDK reads from os.environ at import time, not from pydantic settings.
    This function must be called BEFORE importing any LangChain modules.
    """
    if settings.langchain_tracing_v2 or settings.langsmith_tracing:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"

    # Use langchain_api_key or fall back to langsmith_api_key
    api_key = settings.langchain_api_key or settings.langsmith_api_key
    if api_key:
        os.environ["LANGCHAIN_API_KEY"] = api_key

    # Use langchain_project or fall back to langsmith_project
    project = settings.langchain_project or settings.langsmith_project
    if project:
        os.environ["LANGCHAIN_PROJECT"] = project

    if settings.langsmith_endpoint:
        os.environ["LANGCHAIN_ENDPOINT"] = settings.langsmith_endpoint


# Configure LangSmith immediately when this module is imported
configure_langsmith()

