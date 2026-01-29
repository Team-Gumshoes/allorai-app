"""
MCP Client for connecting to MCP servers.
Shared across all agents that need MCP connectivity.
Added client for testing purposes as well.
"""

import json
import logging
from typing import Any, Dict, List, Optional, Tuple, Union
from contextlib import asynccontextmanager
from dataclasses import dataclass

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from pydantic import BaseModel, Field
from langsmith import traceable

from shared.config import settings

logger = logging.getLogger(__name__)


# =============================================================================
# MCP Request/Response Models
# =============================================================================

class NearbyPlacesRequest(BaseModel):
    """Request model for finding nearby places via MCP."""
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    place_types: Union[List[str], str] = Field(
        default="restaurant",
        description="""A single type or list of place types to search for.
        
        Supported place types (Google Maps API):
            Food & Drink: restaurant, cafe, bar, bakery, meal_takeaway
            Accommodation: lodging, hotel, motel, bed_and_breakfast
            Attractions: tourist_attraction, museum, art_gallery, park, zoo, aquarium
            Entertainment: movie_theater, night_club, casino, amusement_park
            Shopping: shopping_mall, store, clothing_store, jewelry_store
            Transport: airport, train_station, bus_station, subway_station
            Services: bank, atm, hospital, pharmacy, gas_station
            
        Note: Some generic types like 'food', 'point_of_interest', 'natural_feature' 
        may not be supported. Use specific types instead.
        """
    )
    radius_miles: float = Field(default=2.0, description="Search radius in miles (default: 2.0, max: 31)")
    use_mock: bool = Field(default=False, description="If true, return mock data instead of calling MCP server")

    class Config:
        json_schema_extra = {
            "example": {
                "latitude": 48.8584,
                "longitude": 2.2945,
                "place_types": ["restaurant", "cafe", "tourist_attraction"],
                "radius_miles": 2.0,
                "use_mock": False
            }
        }

    def get_place_types_list(self) -> List[str]:
        """Normalize place_types to a list."""
        return self.place_types if isinstance(self.place_types, list) else [self.place_types]

    def to_tool_params(self) -> Dict[str, Any]:
        """Convert request to MCP tool parameters."""
        return {
            "latitude": self.latitude,
            "longitude": self.longitude,
            "radius_miles": self.radius_miles,
            "included_types": self.get_place_types_list()
        }


class NearbyPlacesResponse(BaseModel):
    """Response model for nearby places search."""
    success: bool
    latitude: float
    longitude: float
    included_types: List[str] | str | None = None
    radius_miles: float
    places: List[Dict[str, Any]] = []
    error: Optional[str] = None
    agent: str = "coordinator"

    @classmethod
    def from_mcp_result(
        cls,
        mcp_result: "MCPResult",
        latitude: float,
        longitude: float,
        place_types: List[str],
        radius_miles: float,
        agent: str = "coordinator"
    ) -> "NearbyPlacesResponse":
        """Create a NearbyPlacesResponse from an MCPResult."""
        return cls(
            success=mcp_result.success,
            latitude=latitude,
            longitude=longitude,
            included_types=place_types,
            radius_miles=radius_miles,
            places=mcp_result.data if mcp_result.success else [],
            error=mcp_result.error,
            agent=agent
        )


# =============================================================================
# MCP Result Data Classes
# =============================================================================


@dataclass
class MCPResult:
    """Structured result from MCP tool calls."""
    success: bool
    data: Any = None
    error: Optional[str] = None
    error_code: Optional[str] = None

    @property
    def is_error(self) -> bool:
        return not self.success or self.error is not None


class MCPResponseParser:
    """Utility class for parsing and extracting data from MCP responses."""

    # Common keys used by MCP servers to wrap response data
    DATA_KEYS = ["places", "results", "data", "nearby_places", "items"]

    @staticmethod
    def extract_list_data(result: Any) -> Tuple[list, Optional[str]]:
        """
        Extract list data from various MCP response formats.

        Args:
            result: Raw result from MCP server (dict, list, or str)

        Returns:
            Tuple of (extracted_list, error_message or None)
        """
        if isinstance(result, dict):
            # Check for error in dict response
            if "error" in result:
                error_code = result.get("error")
                error_message = result.get("message", "Unknown MCP error")
                return [], f"{error_code}: {error_message}"

            logger.info(f"Result keys: {result.keys()}")
            # Try common data keys
            for key in MCPResponseParser.DATA_KEYS:
                if result.get(key):
                    return result[key], None
            return [], None

        elif isinstance(result, list):
            return result, None

        elif isinstance(result, str):
            return MCPResponseParser._parse_string_response(result)

        return [], None

    @staticmethod
    def _parse_string_response(result: str) -> Tuple[list, Optional[str]]:
        """Parse string response from MCP server."""
        # Check if it's an error message
        if "validation error" in result.lower() or "error" in result.lower():
            logger.error(f"MCP error response: {result}")
            return [], result

        # Try to parse as JSON
        try:
            parsed = json.loads(result)
            if isinstance(parsed, dict):
                # Check for error in parsed response
                if "error" in parsed:
                    error_code = parsed.get("error")
                    error_message = parsed.get("message", "Unknown MCP error")
                    return [], f"{error_code}: {error_message}"

                # Try common data keys
                for key in MCPResponseParser.DATA_KEYS:
                    if parsed.get(key):
                        return parsed[key], None
                return [], None

            elif isinstance(parsed, list):
                return parsed, None

        except json.JSONDecodeError:
            logger.warning(f"Could not parse result as JSON: {result}")

        return [], None

    @staticmethod
    def check_error_response(result: Any) -> Optional[str]:
        """
        Check if the result contains an error response.

        Args:
            result: Raw result from MCP server

        Returns:
            Error message string if error found, None otherwise
        """
        if isinstance(result, dict) and "error" in result:
            error_code = result.get("error")
            error_message = result.get("message", "Unknown MCP error")
            logger.error(f"MCP error: {error_code} - {error_message}")
            return f"{error_code}: {error_message}"
        return None


class MCPClient:
    """Client for communicating with MCP servers via HTTP (FastMCP HTTP transport)."""

    def __init__(self, base_url: Optional[str] = None):
        # FastMCP HTTP transport endpoint,
        self.base_url = base_url or getattr(settings, 'mcp_server_url', 'http://127.0.0.1:8001/mcp')
        self.parser = MCPResponseParser()

    @asynccontextmanager
    async def _get_session(self):
        """Create an MCP session using streamable HTTP transport."""
        try:
            logger.info(f"Connecting to MCP server at {self.base_url}")
            async with streamable_http_client(self.base_url) as (read, write, _):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    logger.info("MCP session initialized successfully")
                    yield session
        except Exception as e:
            logger.error(f"Failed to establish MCP session: {e}", exc_info=True)
            raise

    @traceable(name="mcp_call_tool", run_type="tool")
    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """
        Call a tool on the MCP server.

        Args:
            tool_name: Name of the MCP tool to call
            arguments: Dictionary of arguments to pass to the tool

        Returns:
            The result from the MCP server
        """
        logger.info(f"Calling MCP tool: {tool_name} with args: {arguments}")

        async with self._get_session() as session:
            result = await session.call_tool(tool_name, arguments)
            logger.info(f"MCP raw response: {result}")

            # Extract content from the result
            if result.content:
                for content in result.content:
                    if hasattr(content, 'text'):
                        text = content.text
                        # Try to parse as JSON if it looks like JSON
                        if text and (text.startswith('{') or text.startswith('[')):
                            try:
                                return json.loads(text)
                            except json.JSONDecodeError:
                                pass
                        return text
                return result.content
            return result

    @traceable(name="mcp_call_tool_for_list", run_type="tool")
    async def call_tool_for_list(self, tool_name: str, arguments: dict[str, Any]) -> MCPResult:
        """
        Call a tool and extract list data from the response.

        This is a convenience method for tools that return lists of items
        (e.g., nearby places, search results).

        Args:
            tool_name: Name of the MCP tool to call
            arguments: Dictionary of arguments to pass to the tool

        Returns:
            MCPResult with extracted list data or error information
        """
        try:
            result = await self.call_tool(tool_name, arguments)
            logger.info(f"MCP result type: {type(result)}")
            logger.info(f"MCP result: {result}")

            # Check for immediate error response
            error = self.parser.check_error_response(result)
            if error:
                return MCPResult(success=False, data=[], error=error)

            # Extract list data
            data, error = self.parser.extract_list_data(result)
            if error:
                return MCPResult(success=False, data=[], error=error)

            logger.info(f"Extracted {len(data)} items from MCP response")
            return MCPResult(success=True, data=data)

        except Exception as e:
            logger.error(f"Error calling MCP tool {tool_name}: {e}", exc_info=True)
            return MCPResult(success=False, data=[], error=str(e))

    async def list_tools(self) -> list[dict]:
        """List all available tools on the MCP server."""
        logger.info(f"Listing tools from MCP server at {self.base_url}")
        async with self._get_session() as session:
            result = await session.list_tools()
            tools = [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "inputSchema": tool.inputSchema
                }
                for tool in result.tools
            ]
            logger.info(f"Found {len(tools)} tools: {[t['name'] for t in tools]}")
            return tools

    @traceable(name="mcp_search_nearby_places", run_type="tool")
    async def search_nearby_places(
        self,
        request: NearbyPlacesRequest,
        mock_data_provider: Optional[callable] = None
    ) -> NearbyPlacesResponse:
        """
        Search for nearby places using the MCP server or mock data.

        This is a convenience method that handles the full flow:
        - Mock data support (if use_mock is enabled and provider is given)
        - MCP tool call
        - Response parsing and conversion to NearbyPlacesResponse

        Args:
            request: NearbyPlacesRequest with coordinates and place types
            mock_data_provider: Optional callable that returns mock data dict.
                               Signature: (latitude, longitude, place_types, radius_miles) -> dict

        Returns:
            NearbyPlacesResponse with places or error information
        """
        place_types = request.get_place_types_list()

        # Return mock data if use_mock is enabled and provider is given
        if request.use_mock and mock_data_provider:
            logger.info("Returning mock data for nearby places")
            mock_response = mock_data_provider(
                latitude=request.latitude,
                longitude=request.longitude,
                place_types=place_types,
                radius_miles=request.radius_miles
            )
            return NearbyPlacesResponse(**mock_response)

        # Call MCP server
        logger.info(f"MCP client initialized with URL: {self.base_url}")
        tool_params = request.to_tool_params()
        logger.info(f"Calling search_nearby_places with params: {tool_params}")

        mcp_result = await self.call_tool_for_list("search_nearby_places", tool_params)

        response = NearbyPlacesResponse.from_mcp_result(
            mcp_result=mcp_result,
            latitude=request.latitude,
            longitude=request.longitude,
            place_types=place_types,
            radius_miles=request.radius_miles
        )

        logger.info(f"Returning response with {len(response.places)} places")
        return response



def get_mcp_client(base_url: Optional[str] = None) -> MCPClient:
    """
    Get or create an MCP client instance.

    Args:
        base_url: Optional URL to override the default MCP server URL.
                  If not provided, uses MCP_SERVER_URL from settings.

    Returns:
        MCPClient instance
    """
    url = base_url or getattr(settings, 'mcp_server_url', 'http://127.0.0.1:8001/mcp')
    return MCPClient(base_url=url)
