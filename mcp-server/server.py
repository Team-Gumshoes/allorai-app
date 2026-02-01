import logging
from typing import Dict, Any

import httpx
from fastmcp import FastMCP
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from tavily import TavilyClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mcp-server")


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    google_api_key: str = ""
    google_maps_base_url: str = "https://maps.googleapis.com/maps/api/place"
    tavily_api_key: str = ""


settings = Settings()

mcp = FastMCP("Travel App MCP Server")

# Constants
METERS_PER_MILE = 1609.34


def _miles_to_meters(miles: float) -> int:
    """Convert miles to meters for Google Maps API."""
    return int(miles * METERS_PER_MILE)


@mcp.tool
def greet(name: str) -> str:
    """Greet a user by their name."""
    logger.info(f"Greeting user: {name}")
    return f"Hello, {name}! Welcome to the Travel App MCP Server."


def _search_nearby_places(
        latitude: float,
        longitude: float,
        radius_miles: float,
        place_type: str,
) -> dict:
    """
    Internal function to search for nearby places using Google Maps API.
    """
    radius_meters = _miles_to_meters(radius_miles)
    logger.info(f"Searching nearby places: lat={latitude}, lng={longitude}, radius={radius_miles} miles ({radius_meters}m), type={place_type}")

    if not settings.google_api_key:
        logger.error("GOOGLE_API_KEY environment variable is not set")
        return {"error": "GOOGLE_API_KEY environment variable is not set"}

    url = f"{settings.google_maps_base_url}/nearbysearch/json"
    params = {
        "location": f"{latitude},{longitude}",
        "radius": radius_meters,
        "type": place_type,
        "key": settings.google_api_key,
    }

    try:
        with httpx.Client() as client:
            logger.debug(f"Making request to: {url}")
            response = client.get(url, params=params)
            data = response.json()
    except httpx.RequestError as e:
        logger.error(f"Request failed: {e}")
        return {"error": "Request failed", "message": str(e)}

    if data.get("status") != "OK":
        logger.warning(f"API returned non-OK status: {data.get('status')} - {data.get('error_message', 'Unknown error')}")
        return {"error": data.get("status"), "message": data.get("error_message", "Unknown error")}

    # Extract relevant information from results
    places = []
    for place in data.get("results", []):
        places.append({
            "name": place.get("name"),
            "address": place.get("vicinity"),
            "rating": place.get("rating"),
            "total_ratings": place.get("user_ratings_total"),
            "place_id": place.get("place_id"),
            "types": place.get("types"),
            "is_open": place.get("opening_hours", {}).get("open_now"),
            "price_level": place.get("price_level"),
            "location": place.get("geometry", {}).get("location"),
        })

    logger.info(f"Found {len(places)} places")
    return {
        "status": "success",
        "count": len(places),
        "places": places,
    }


VALID_PLACE_TYPES = [
    "restaurant", "cafe", "food", "bar", "bakery",
    "lodging", "tourist_attraction", "museum", "art_gallery", "park", "shopping_mall",
    "store", "natural_feature",
    "point_of_interest"
]

class SearchNearbyPlacesInputSchema(BaseSettings):
    latitude: float = Field(..., description="The latitude of the location to search around.")
    longitude: float = Field(..., description="The longitude of the location to search around.")
    included_types: list[str] = Field(
        default_factory=lambda: ["restaurant"],
        description="A list of place types to search for. Valid types include: " + ", ".join(VALID_PLACE_TYPES),
        json_schema_extra={"enum": VALID_PLACE_TYPES},
    )
    radius_miles: float = Field(2.0, description="The radius in miles to search within (default: 2.0, max: 31).")
    max_results: int = Field(20, description="Maximum number of results to return (default: 20, max: 20).")

    @field_validator("included_types", mode="before")
    def validate_included_types(cls, value):
        if isinstance(value, list):
            for item in value:
                if item not in VALID_PLACE_TYPES:
                    raise ValueError(f"Invalid place type: {item}. Valid types are: {', '.join(VALID_PLACE_TYPES)}")
        elif value not in VALID_PLACE_TYPES:
            raise ValueError(f"Invalid place type: {value}. Valid types are: {', '.join(VALID_PLACE_TYPES)}")
        return value

##todo define enum values for place types based on requirements to be viewable when calling get tools endpoint
@mcp.tool(
    name="search_nearby_places",
    description="Search for nearby places using Google Maps Places API (New).\n\n This uses the new Places API which supports multiple place types in a single request.\n\nArgs:\n    latitude: The latitude of the location to search around.\n    longitude: The longitude of the location to search around.\n    included_types: A single type or list of place types to search for.\n\n        Examples:\n            - Single type: \"restaurant\"\n            - Multiple types: [\"restaurant\", \"tourist_attraction\", \"cafe\"]\n\n    radius_miles: The radius in miles to search within (default: 2.0, max: 31).\n    max_results: Maximum number of results to return (default: 20, max: 20).\n\nReturns:\n    A dictionary containing the search results with place information."
)
def search_nearby_places(
        latitude: float,
        longitude: float,
        included_types: list[str] | str | None = None,
        radius_miles: float = 2.0,
        max_results: int = 20,
) -> dict:
    """
    Search for nearby places using Google Maps Places API (New).

    This uses the new Places API which supports multiple place types in a single request.

    Args:
        latitude: The latitude of the location to search around.
        longitude: The longitude of the location to search around.
        included_types: A single type or list of place types to search for.

            Examples:
                - Single type: "restaurant"
                - Multiple types: ["restaurant", "tourist_attraction", "cafe"]

        radius_miles: The radius in miles to search within (default: 2.0, max: 31).
        max_results: Maximum number of results to return (default: 20, max: 20).

    Returns:
        A dictionary containing the search results with place information.

    Valid place types for included_types:
        - restaurant
        - cafe
        - food
        - bar
        - bakery
        - lodging
        - tourist_attraction
        - museum
        - art_gallery
        - park
        - shopping_mall
        - store
        - natural_feature
        - point_of_interest
    """
    # Normalize to list
    if isinstance(included_types, str):
        included_types = [included_types]

    radius_meters = _miles_to_meters(radius_miles)
    logger.info(
        f"Searching nearby places (New API): lat={latitude}, lng={longitude}, "
        f"radius={radius_miles} miles ({radius_meters}m), types={included_types}"
    )

    if not settings.google_api_key:
        logger.error("GOOGLE_API_KEY environment variable is not set")
        return {"error": "GOOGLE_API_KEY environment variable is not set"}

    # New Places API endpoint
    url = "https://places.googleapis.com/v1/places:searchNearby"

    # Request body for the new API
    request_body = {
        "includedTypes": included_types,
        "maxResultCount": min(max_results, 20),  # API max is 20
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": latitude,
                    "longitude": longitude,
                },
                "radius": float(radius_meters),
            }
        },
    }

    # Headers required for the new API
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.google_api_key,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.formattedAddress,places.rating,"
            "places.userRatingCount,places.types,places.priceLevel,places.location,"
            "places.currentOpeningHours,places.photos,places.primaryType,"
            "places.editorialSummary,places.websiteUri,places.googleMapsUri"
        ),
    }

    try:
        with httpx.Client() as client:
            logger.debug(f"Making POST request to: {url}")
            response = client.post(url, json=request_body, headers=headers)
            data = response.json()
    except httpx.RequestError as e:
        logger.error(f"Request failed: {e}")
        return {"error": "Request failed", "message": str(e)}

    # Check for API errors
    if "error" in data:
        error_info = data["error"]
        logger.warning(f"API error: {error_info.get('message', 'Unknown error')}")
        return {"error": error_info.get("status"), "message": error_info.get("message", "Unknown error")}

    # Extract relevant information from results
    places = []
    for place in data.get("places", []):
        places.append({
            "name": place.get("displayName", {}).get("text"),
            "address": place.get("formattedAddress"),
            "rating": place.get("rating"),
            "total_ratings": place.get("userRatingCount"),
            "place_id": place.get("id"),
            "types": place.get("types"),
            "primary_type": place.get("primaryType"),
            "is_open": place.get("currentOpeningHours", {}).get("openNow"),
            "price_level": place.get("priceLevel"),
            "location": place.get("location"),
            "editorial_summary": place.get("editorialSummary", {}).get("text"),
            "website": place.get("websiteUri"),
            "google_maps_url": place.get("googleMapsUri"),
            "photos": [
                photo.get("name") for photo in place.get("photos", [])[:3]
            ] if place.get("photos") else None,
        })

    logger.info(f"Found {len(places)} places")
    return {
        "status": "success",
        "count": len(places),
        "searched_types": included_types,
        "places": places,
    }


##modify for requirements=
@mcp.tool
def search_places_by_text(query: str) -> dict:
    """
    Search for places using a natural language text query.

    Args:
        query: A natural language search query (e.g., "best pizza restaurants in Dallas Texas").

    Returns:
        A dictionary containing the search results with place information.
    """
    logger.info(f"Text search for places: query='{query}'")

    if not settings.google_api_key:
        logger.error("GOOGLE_API_KEY environment variable is not set")
        return {"error": "GOOGLE_API_KEY environment variable is not set"}

    url = f"{settings.google_maps_base_url}/textsearch/json"
    params = {
        "query": query,
        "key": settings.google_api_key,
    }

    try:
        with httpx.Client() as client:
            logger.debug(f"Making request to: {url}")
            response = client.get(url, params=params)
            data = response.json()
    except httpx.RequestError as e:
        logger.error(f"Request failed: {e}")
        return {"error": "Request failed", "message": str(e)}

    if data.get("status") != "OK":
        logger.warning(f"API returned non-OK status: {data.get('status')} - {data.get('error_message', 'Unknown error')}")
        return {"error": data.get("status"), "message": data.get("error_message", "Unknown error")}

    # Extract relevant information from results
    places = []
    for place in data.get("results", []):
        places.append({
            "name": place.get("name"),
            "address": place.get("formatted_address"),
            "rating": place.get("rating"),
            "total_ratings": place.get("user_ratings_total"),
            "place_id": place.get("place_id"),
            "types": place.get("types"),
            "is_open": place.get("opening_hours", {}).get("open_now"),
            "price_level": place.get("price_level"),
            "location": place.get("geometry", {}).get("location"),
        })

    logger.info(f"Found {len(places)} places for query '{query}'")
    return {
        "status": "success",
        "count": len(places),
        "places": places,
    }


tavily_client = TavilyClient(api_key=settings.tavily_api_key)

##todo modify
@mcp.tool(name="web_search", description="Search the web for information")
def web_search(query: str) -> Dict[str, Any]:
    """Search the web for information"""
    logger.info(f"Web search: query='{query}'")

    if not settings.tavily_api_key:
        logger.error("TAVILY_API_KEY environment variable is not set")
        return {"error": "TAVILY_API_KEY environment variable is not set"}

    try:
        result = tavily_client.search(query)
        logger.info(f"Web search completed for query '{query}'")
        return result
    except Exception as e:
        logger.error(f"Web search failed: {e}")
        return {"error": "Web search failed", "message": str(e)}


@mcp.tool
def get_valid_place_types() -> list[str]:
    """
    Get a list of generic valid place types for the included_types parameter.

    Returns:
        A list of generic valid place types supported by the Google Maps Places API.
    """
    return [
        "restaurant", "cafe", "food", "bar", "bakery", "meal_takeaway",
        "lodging", "tourist_attraction", "museum", "art_gallery", "park",
        "zoo", "aquarium", "movie_theater", "night_club", "shopping_mall",
        "store", "clothing_store", "jewelry_store", "natural_feature",
        "point_of_interest"
    ]


if __name__ == "__main__":
    logger.info("Starting MCP Server on port 8001")
    mcp.run(transport="http", port=8001)
##fastmcp run server.py:mcp
## fastmcp run server.py:mcp --transport http --port 8001
