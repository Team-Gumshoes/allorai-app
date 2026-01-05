"""
LangChain tools for transport search operations.
Uses @tool decorator to create reusable agent tools.
"""

from langchain.tools import tool
from typing import List, Dict, Any
from agents.transport.services.transport_api import TransportAPIClient
import logging

logger = logging.getLogger(__name__)


@tool
async def search_car_rentals(
    location: str,
    pickup_date: str,
    return_date: str,
    car_type: str = None
) -> List[Dict[str, Any]]:
    """
    Search for car rental options at a specific location.

    Args:
        location: Pickup/return location (e.g., "Paris Airport", "Downtown NYC")
        pickup_date: Pickup date in YYYY-MM-DD format
        return_date: Return date in YYYY-MM-DD format
        car_type: Preferred car type - Economy, Compact, Midsize, SUV, Luxury (optional)

    Returns:
        List of available car rentals with details including type, model, price, capacity

    Example:
        search_car_rentals("Paris Airport", "2024-06-01", "2024-06-05", car_type="Economy")
    """
    logger.info(f"Searching car rentals in {location} from {pickup_date} to {return_date}")

    client = TransportAPIClient()
    results = await client.search_car_rentals(
        location=location,
        pickup_date=pickup_date,
        return_date=return_date,
        car_type=car_type
    )

    logger.info(f"Found {len(results)} car rental options")
    return results


@tool
async def search_trains(
    origin: str,
    destination: str,
    travel_date: str,
    travel_class: str = None
) -> List[Dict[str, Any]]:
    """
    Search for train connections between two cities.

    Args:
        origin: Origin station or city (e.g., "Paris", "London")
        destination: Destination station or city
        travel_date: Travel date in YYYY-MM-DD format
        travel_class: Preferred class - Economy, Business, First (optional)

    Returns:
        List of train options with departure/arrival times, duration, price, available seats

    Example:
        search_trains("Paris", "Lyon", "2024-06-01", travel_class="Economy")
    """
    logger.info(f"Searching trains from {origin} to {destination} on {travel_date}")

    client = TransportAPIClient()
    results = await client.search_trains(
        origin=origin,
        destination=destination,
        travel_date=travel_date,
        travel_class=travel_class
    )

    logger.info(f"Found {len(results)} train options")
    return results


@tool
async def search_local_transport(
    location: str,
    transport_type: str = "all"
) -> List[Dict[str, Any]]:
    """
    Get information about local public transport options in a city.

    Args:
        location: City or location (e.g., "Paris", "New York")
        transport_type: Type of transport - bus, metro, taxi, or all (default: all)

    Returns:
        List of local transport options with details about routes, schedules, prices

    Example:
        search_local_transport("Paris", transport_type="metro")
    """
    logger.info(f"Searching local transport in {location} (type: {transport_type})")

    client = TransportAPIClient()
    results = await client.search_local_transport(
        location=location,
        transport_type=transport_type
    )

    logger.info(f"Found {len(results)} local transport options")
    return results


# Export tools for use in agent
transport_tools = [search_car_rentals, search_trains, search_local_transport]
