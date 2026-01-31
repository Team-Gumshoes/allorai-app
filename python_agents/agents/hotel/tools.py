"""
LangChain tools for hotel search and booking operations.
Uses @tool decorator to create reusable agent tools.
"""

from langchain.tools import tool
from typing import List, Dict, Any
from agents.hotel.services.hotel_api import HotelAPIClient
import logging

logger = logging.getLogger(__name__)


@tool
async def search_hotels(
    location: str,
    check_in: str,
    check_out: str,
    guests: int = 2,
    max_price: float = None,
    min_rating: float = None
) -> List[Dict[str, Any]]:
    """
    Search for hotels based on location, dates, and preferences.

    Args:
        location: Hotel location/destination (e.g., "Paris", "New York")
        check_in: Check-in date in YYYY-MM-DD format
        check_out: Check-out date in YYYY-MM-DD format
        guests: Number of guests (default: 2)
        max_price: Maximum price per night in USD (optional)
        min_rating: Minimum hotel rating 0-5 (optional)

    Returns:
        List of available hotels with details including name, price, rating, amenities

    Example:
        search_hotels("Paris", "2024-06-01", "2024-06-05", guests=2, max_price=200)
    """
    logger.info(f"Searching hotels in {location} from {check_in} to {check_out}")

    client = HotelAPIClient()
    results = await client.search_hotels(
        location=location,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        max_price=max_price,
        min_rating=min_rating
    )

    logger.info(f"Found {len(results)} hotels")
    return results


@tool
async def get_hotel_details(hotel_id: str) -> Dict[str, Any]:
    """
    Get detailed information about a specific hotel.

    Args:
        hotel_id: Unique hotel identifier

    Returns:
        Detailed hotel information including description, amenities, room types,
        policies, images, and reviews

    Example:
        get_hotel_details("hotel_001")
    """
    logger.info(f"Fetching details for hotel: {hotel_id}")

    client = HotelAPIClient()
    details = await client.get_hotel_details(hotel_id)

    logger.info(f"Retrieved details for {details.get('name', hotel_id)}")
    return details


# Export tools for use in agent
hotel_tools = [search_hotels, get_hotel_details]
