"""
Hotel API client with mock mode support.
Handles communication with external hotel APIs or returns mock data.
"""

from typing import List, Dict, Any
import logging
from shared.config import settings
from shared.mock_data import generate_mock_hotels, generate_mock_hotel_details
from shared.http_client import HTTPClient

logger = logging.getLogger(__name__)


class HotelAPIClient:
    """Client for interacting with hotel search APIs."""

    def __init__(self, use_mock: bool = None):
        """
        Initialize hotel API client.

        Args:
            use_mock: Whether to use mock responses (defaults to settings.use_mock_responses)
        """
        self.use_mock = use_mock if use_mock is not None else settings.use_mock_responses
        self.api_url = settings.hotel_api_url

    async def search_hotels(
        self,
        location: str,
        check_in: str,
        check_out: str,
        guests: int = 2,
        max_price: float = None,
        min_rating: float = None
    ) -> List[Dict[str, Any]]:
        """
        Search for hotels based on criteria.

        Args:
            location: Hotel location/destination
            check_in: Check-in date (YYYY-MM-DD)
            check_out: Check-out date (YYYY-MM-DD)
            guests: Number of guests
            max_price: Maximum price per night
            min_rating: Minimum hotel rating

        Returns:
            List of hotel search results
        """
        if self.use_mock:
            logger.info(f"Using mock data for hotel search: {location}")
            hotels = generate_mock_hotels(location, check_in, check_out, guests)

            # Apply filters
            if max_price is not None:
                hotels = [h for h in hotels if h["price_per_night"] <= max_price]

            if min_rating is not None:
                hotels = [h for h in hotels if h["rating"] >= min_rating]

            return hotels

        # Real API call
        async with HTTPClient() as client:
            try:
                response = await client.get(
                    f"{self.api_url}/hotels/search",
                    params={
                        "location": location,
                        "check_in": check_in,
                        "check_out": check_out,
                        "guests": guests,
                        "max_price": max_price,
                        "min_rating": min_rating
                    }
                )
                return response.get("hotels", [])
            except Exception as e:
                logger.error(f"Hotel search API error: {e}")
                # Fallback to mock data on error
                logger.info("Falling back to mock data")
                return generate_mock_hotels(location, check_in, check_out, guests)

    async def get_hotel_details(self, hotel_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific hotel.

        Args:
            hotel_id: Hotel identifier

        Returns:
            Hotel details
        """
        if self.use_mock:
            logger.info(f"Using mock data for hotel details: {hotel_id}")
            return generate_mock_hotel_details(hotel_id)

        # Real API call
        async with HTTPClient() as client:
            try:
                response = await client.get(f"{self.api_url}/hotels/{hotel_id}")
                return response
            except Exception as e:
                logger.error(f"Hotel details API error: {e}")
                # Fallback to mock data on error
                logger.info("Falling back to mock data")
                return generate_mock_hotel_details(hotel_id)
