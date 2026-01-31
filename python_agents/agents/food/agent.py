"""
Food Agent - A foodie recommender that uses MCP tools to find nearby food locations.
"""

import logging
import os
from typing import Optional, List

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langsmith import traceable

from shared.config import settings
from shared.mcp_client import get_mcp_client, NearbyPlacesRequest, NearbyPlacesResponse

logger = logging.getLogger(__name__)

# Configure LangSmith tracing todo, use pythantic for setup
if settings.langsmith_tracing or settings.langchain_tracing_v2:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    if settings.langsmith_api_key:
        os.environ["LANGCHAIN_API_KEY"] = settings.langsmith_api_key
    if settings.langsmith_project:
        os.environ["LANGCHAIN_PROJECT"] = settings.langsmith_project
    if settings.langsmith_endpoint:
        os.environ["LANGCHAIN_ENDPOINT"] = settings.langsmith_endpoint
    logger.info("LangSmith tracing enabled")

# System prompt for the foodie agent
FOODIE_SYSTEM_PROMPT = """You are a foodie assistant that is guiding travelers in new areas.
You are talking to a travel manager who will ask you for guidance on food options for their clients.
You help users discover great food options, restaurants, and local cuisine.

You have access to tools that can help you:
- Search for nearby restaurants and food locations
- Provide restaurant recommendations based on user preferences
- Consider convenience factors like distance
- Get information about local cuisine and food recommendations with search

When making recommendations:
- Consider the user's preferences and dietary restrictions if any
- Provide specific restaurant names when available
- Include details like cuisine type, price range, and specialties
"""


class FoodAgent:
    """Food agent that uses MCP tools for foodie recommendations."""

    def __init__(self):
        self.llm = ChatOpenAI(
            # model=settings.openai_model,
            model="gpt-5-mini",
            temperature=settings.temperature,
            api_key=settings.openai_api_key,
        )
        self.mcp_client = get_mcp_client()

    async def greet(self, name: str) -> str:
        """Greet a user using the MCP greet tool."""
        result = await self.mcp_client.call_tool("greet", {"name": name})
        return result

    @traceable(name="food_search_nearby_places", run_type="chain")
    async def search_nearby_places(
        self,
        latitude: float,
        longitude: float,
        place_types: Optional[List[str]] = None,
        radius_miles: float = 2.0,
        use_mock: bool = False,
    ) -> NearbyPlacesResponse:
        """
        Search for nearby food places using the MCP server.

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            place_types: List of place types (default: ["restaurant", "cafe"])
            radius_miles: Search radius in miles (default: 2.0)
            use_mock: If true, return mock data instead of calling MCP server

        Returns:
            NearbyPlacesResponse with places or error information
        """
        # Default to food-related place types
        if place_types is None:
            place_types = ["restaurant", "cafe"]

        request = NearbyPlacesRequest(
            latitude=latitude,
            longitude=longitude,
            place_types=place_types,
            radius_miles=radius_miles,
            use_mock=use_mock,
        )

        logger.info(f"Food agent searching nearby places at ({latitude}, {longitude})")

        response = await self.mcp_client.search_nearby_places(request=request)
        response.agent = "food"  # Override agent name

        return response

    @traceable(name="food_search", run_type="chain")
    async def search_food(
        self,
        query: str,
        location: Optional[str] = None,
        cuisine_type: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_miles: float = 2.0,
        place_types: Optional[List[str]] = None,
    ) -> dict:
        """
        Search for food recommendations.

        Args:
            query: Search query (e.g., "best pizza", "vegetarian restaurants")
            location: Optional location name to search near
            cuisine_type: Optional cuisine type filter
            latitude: Optional latitude coordinate of starting point
            longitude: Optional longitude coordinate of starting point
            radius_miles: Search radius in miles (default: 2.0)
            place_types: Optional list of place types (default: ["restaurant", "cafe"])

        Returns:
            Food recommendations from MCP server or LLM
        """

        if latitude is not None and longitude is not None:
            try:
                # Default to food-related place types
                if place_types is None:
                    place_types = ["restaurant", "cafe"]

                logger.info(f"Searching nearby food places at lat={latitude}, lng={longitude}, radius={radius_miles} miles")

                response = await self.search_nearby_places(
                    latitude=latitude,
                    longitude=longitude,
                    place_types=place_types,
                    radius_miles=radius_miles,
                )

                if response.success:
                    return {
                        "source": "mcp",
                        "tools_used": ["search_nearby_places"],
                        "query": query,
                        "search_params": {
                            "latitude": latitude,
                            "longitude": longitude,
                            "radius_miles": radius_miles,
                            "place_types": place_types,
                            "cuisine_type": cuisine_type,
                            "location": location,
                        },
                        "results": response.places,
                    }
                else:
                    logger.error(f"MCP search failed: {response.error}")
                    raise Exception(f"MCP search failed: {response.error}")

            except Exception as e:
                logger.error(f"MCP search_nearby_places failed: {e}", exc_info=True)
                raise Exception(f"MCP search_nearby_places failed: {e}")

        # If no latitude and longitude are provided, raise an error
        raise ValueError("Latitude and longitude must be provided for food search.")

    async def get_recommendation(self, user_message: str) -> str:
        """
        Get a foodie recommendation based on user's message.

        Args:
            user_message: The user's request or question

        Returns:
            A helpful foodie recommendation
        """
        messages = [
            SystemMessage(content=FOODIE_SYSTEM_PROMPT),
            HumanMessage(content=user_message),
        ]

        response = await self.llm.ainvoke(messages, config=RunnableConfig(run_name="food_recommendation"))
        return response.content

    async def chat(self, message: str, context: Optional[list[dict]] = None) -> str:
        """
        Have a conversation with the foodie agent.

        Args:
            message: User's message
            context: Optional conversation history

        Returns:
            Agent's response
        """
        messages: list = [SystemMessage(content=FOODIE_SYSTEM_PROMPT)]

        # Add conversation context if provided
        if context:
            for msg in context:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))

        messages.append(HumanMessage(content=message))

        response = await self.llm.ainvoke(messages, config=RunnableConfig(run_name="food_chat"))
        return response.content


# Singleton instance
_food_agent: Optional[FoodAgent] = None


def get_food_agent() -> FoodAgent:
    """Get or create the food agent instance."""
    global _food_agent
    if _food_agent is None:
        _food_agent = FoodAgent()
    return _food_agent
