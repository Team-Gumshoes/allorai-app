"""
LangChain tools for coordinator to delegate to other agents.
Includes HTTP calls to TypeScript agents and local Python agents.
"""

from langchain.tools import tool
from typing import Dict, Any
import httpx
from shared.config import settings
from shared.http_client import HTTPClient
from agents.hotel.agent import get_hotel_agent
from agents.transport.agent import get_transport_agent
import logging

logger = logging.getLogger(__name__)


@tool
async def delegate_to_flight_agent(query: str) -> Dict[str, Any]:
    """
    Delegate a flight-related query to the Flight Agent (TypeScript service).

    The Flight Agent handles all flight searches, bookings, and flight-related queries.
    It runs as a separate TypeScript service and is accessed via HTTP.

    Args:
        query: Natural language query about flights (e.g., "Find flights from NYC to Paris on June 1st")

    Returns:
        Response from the Flight Agent containing flight search results or information

    Example:
        delegate_to_flight_agent("Search for flights from New York to Paris departing June 1st, returning June 10th, for 2 passengers")
    """
    logger.info(f"Delegating to Flight Agent: {query}")

    try:
        # Make HTTP POST request to TypeScript flight agent
        async with HTTPClient() as client:
            url = f"{settings.typescript_agents_url}/flight/search"
            payload = {"query": query}

            logger.info(f"Calling Flight Agent at {url}")
            response = await client.post(url, json=payload)

            logger.info("Flight Agent response received")
            return response

    except httpx.HTTPError as e:
        logger.error(f"Error calling Flight Agent: {e}")
        return {
            "success": False,
            "error": f"Failed to contact Flight Agent: {str(e)}",
            "agent": "flight"
        }
    except Exception as e:
        logger.error(f"Unexpected error calling Flight Agent: {e}")
        return {
            "success": False,
            "error": str(e),
            "agent": "flight"
        }


@tool
async def delegate_to_hotel_agent(query: str) -> Dict[str, Any]:
    """
    Delegate a hotel-related query to the Hotel Agent (Python service).

    The Hotel Agent handles hotel searches, bookings, and accommodation-related queries.
    It runs locally in the same Python process.

    Args:
        query: Natural language query about hotels (e.g., "Find hotels in Paris for June 1-5")

    Returns:
        Response from the Hotel Agent containing hotel search results or information

    Example:
        delegate_to_hotel_agent("Find 4-star hotels in Paris from June 1-5 for 2 guests with free WiFi under $200/night")
    """
    logger.info(f"Delegating to Hotel Agent: {query}")

    try:
        # Get local hotel agent instance
        agent = get_hotel_agent()

        # Process query
        result = await agent.process_query(query)

        logger.info("Hotel Agent response received")
        return result

    except Exception as e:
        logger.error(f"Error calling Hotel Agent: {e}")
        return {
            "success": False,
            "error": str(e),
            "agent": "hotel"
        }


@tool
async def delegate_to_transport_agent(query: str) -> Dict[str, Any]:
    """
    Delegate a transport-related query to the Transport Agent (Python service).

    The Transport Agent handles car rentals, train searches, and local transport queries.
    It runs locally in the same Python process.

    Args:
        query: Natural language query about transport (e.g., "Find car rentals in Paris" or "Search trains from Paris to Lyon")

    Returns:
        Response from the Transport Agent containing transport options and information

    Example:
        delegate_to_transport_agent("Find economy car rentals at Paris Airport from June 1-5")
    """
    logger.info(f"Delegating to Transport Agent: {query}")

    try:
        # Get local transport agent instance
        agent = get_transport_agent()

        # Process query
        result = await agent.process_query(query)

        logger.info("Transport Agent response received")
        return result

    except Exception as e:
        logger.error(f"Error calling Transport Agent: {e}")
        return {
            "success": False,
            "error": str(e),
            "agent": "transport"
        }


# Export tools for use in coordinator agent
coordinator_tools = [
    delegate_to_flight_agent,
    delegate_to_hotel_agent,
    delegate_to_transport_agent
]
