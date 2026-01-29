"""
HTTP client wrapper using httpx for async requests.
Provides reusable HTTP client with error handling and timeouts.
"""

import httpx
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class HTTPClient:
    """Async HTTP client wrapper with proper connection pooling."""

    def __init__(self, timeout: float = 30.0):
        """
        Initialize HTTP client.

        Args:
            timeout: Request timeout in seconds
        """
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self):
        """Async context manager entry."""
        self._client = httpx.AsyncClient(timeout=self.timeout)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self._client:
            await self._client.aclose()

    async def post(
        self,
        url: str,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Make an async POST request.

        Args:
            url: Target URL
            json: JSON payload
            headers: Request headers

        Returns:
            Response JSON data

        Raises:
            httpx.HTTPError: On request failure
        """
        if not self._client:
            raise RuntimeError("HTTP client not initialized. Use async context manager.")

        try:
            logger.info(f"POST request to {url}")
            response = await self._client.post(url, json=json, headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP request failed: {e}")
            raise

    async def get(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Make an async GET request.

        Args:
            url: Target URL
            params: Query parameters
            headers: Request headers

        Returns:
            Response JSON data

        Raises:
            httpx.HTTPError: On request failure
        """
        if not self._client:
            raise RuntimeError("HTTP client not initialized. Use async context manager.")

        try:
            logger.info(f"GET request to {url}")
            response = await self._client.get(url, params=params, headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP request failed: {e}")
            raise


# Global client instance for reuse
async def get_http_client() -> HTTPClient:
    """
    Factory function to create HTTP client.

    Returns:
        HTTPClient instance
    """
    return HTTPClient()
