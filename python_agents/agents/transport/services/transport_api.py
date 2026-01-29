"""
Transport API client with mock mode support.
Handles communication with external transport APIs or returns mock data.
"""

from typing import List, Dict, Any
import logging
from shared.config import settings
from shared.mock_data import (
    generate_mock_car_rentals,
    generate_mock_trains,
    generate_mock_local_transport
)
from shared.http_client import HTTPClient

logger = logging.getLogger(__name__)


class TransportAPIClient:
    """Client for interacting with transport search APIs."""

    def __init__(self, use_mock: bool = None):
        """
        Initialize transport API client.

        Args:
            use_mock: Whether to use mock responses (defaults to settings.use_mock_responses)
        """
        self.use_mock = use_mock if use_mock is not None else settings.use_mock_responses
        self.api_url = settings.transport_api_url

    async def search_car_rentals(
        self,
        location: str,
        pickup_date: str,
        return_date: str,
        car_type: str = None
    ) -> List[Dict[str, Any]]:
        """
        Search for car rental options.

        Args:
            location: Pickup/return location
            pickup_date: Pickup date (YYYY-MM-DD)
            return_date: Return date (YYYY-MM-DD)
            car_type: Preferred car type (Economy, Compact, SUV, etc.)

        Returns:
            List of car rental options
        """
        if self.use_mock:
            logger.info(f"Using mock data for car rentals: {location}")
            rentals = generate_mock_car_rentals(location, pickup_date, return_date)

            # Filter by car type if specified
            if car_type:
                rentals = [r for r in rentals if r["type"].lower() == car_type.lower()]

            return rentals

        # Real API call
        async with HTTPClient() as client:
            try:
                response = await client.get(
                    f"{self.api_url}/rentals/search",
                    params={
                        "location": location,
                        "pickup_date": pickup_date,
                        "return_date": return_date,
                        "car_type": car_type
                    }
                )
                return response.get("rentals", [])
            except Exception as e:
                logger.error(f"Car rental search API error: {e}")
                logger.info("Falling back to mock data")
                return generate_mock_car_rentals(location, pickup_date, return_date)

    async def search_trains(
        self,
        origin: str,
        destination: str,
        travel_date: str,
        travel_class: str = None
    ) -> List[Dict[str, Any]]:
        """
        Search for train connections.

        Args:
            origin: Origin station/city
            destination: Destination station/city
            travel_date: Travel date (YYYY-MM-DD)
            travel_class: Preferred class (Economy, Business, First)

        Returns:
            List of train options
        """
        if self.use_mock:
            logger.info(f"Using mock data for trains: {origin} to {destination}")
            trains = generate_mock_trains(origin, destination, travel_date)

            # Filter by class if specified
            if travel_class:
                trains = [t for t in trains if t["class"].lower() == travel_class.lower()]

            return trains

        # Real API call
        async with HTTPClient() as client:
            try:
                response = await client.get(
                    f"{self.api_url}/trains/search",
                    params={
                        "origin": origin,
                        "destination": destination,
                        "travel_date": travel_date,
                        "class": travel_class
                    }
                )
                return response.get("trains", [])
            except Exception as e:
                logger.error(f"Train search API error: {e}")
                logger.info("Falling back to mock data")
                return generate_mock_trains(origin, destination, travel_date)

    async def search_local_transport(
        self,
        location: str,
        transport_type: str = "all"
    ) -> List[Dict[str, Any]]:
        """
        Get information about local transport options.

        Args:
            location: City/location
            transport_type: Type of transport (bus, metro, taxi, all)

        Returns:
            List of local transport options
        """
        if self.use_mock:
            logger.info(f"Using mock data for local transport: {location}")
            return generate_mock_local_transport(location, transport_type)

        # Real API call
        async with HTTPClient() as client:
            try:
                response = await client.get(
                    f"{self.api_url}/local/search",
                    params={
                        "location": location,
                        "type": transport_type
                    }
                )
                return response.get("transport", [])
            except Exception as e:
                logger.error(f"Local transport search API error: {e}")
                logger.info("Falling back to mock data")
                return generate_mock_local_transport(location, transport_type)
