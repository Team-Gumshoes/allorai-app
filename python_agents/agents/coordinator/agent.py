"""
Coordinator Agent implementation using LangGraph.
Main orchestrator that coordinates between flight, hotel, and transport agents.
"""

from agents.coordinator.graph import get_coordinator_graph
from typing import Dict, Any, Optional, Callable
from shared.mcp_client import get_mcp_client, NearbyPlacesRequest, NearbyPlacesResponse
from langsmith import traceable
import logging

logger = logging.getLogger(__name__)


class CoordinatorAgent:
    """
    Main coordinator agent that orchestrates travel planning across multiple specialized agents.

    Uses LangGraph StateGraph to manage complex workflows involving:
    - Flight searches (delegated to TypeScript flight agent via HTTP)
    - Hotel searches (delegated to local Python hotel agent)
    - Transport searches (delegated to local Python transport agent)

    The coordinator analyzes user queries, delegates to appropriate agents,
    and synthesizes responses into comprehensive travel plans.
    """

    def __init__(self):
        """Initialize the Coordinator Agent with LangGraph."""
        self.graph = get_coordinator_graph()
        self.mcp_client = get_mcp_client()
        logger.info("Coordinator Agent initialized with LangGraph")

    async def coordinate(self, user_query: str) -> Dict[str, Any]:
        """
        Coordinate a complex travel planning request.

        Workflow:
        1. Analyze the user query to identify required agents
        2. Delegate specific tasks to flight, hotel, and/or transport agents
        3. Collect responses from all delegated agents
        4. Synthesize results into a comprehensive travel plan
        5. Return the complete plan to the user

        Args:
            user_query: User's travel planning request (can be complex, multi-part)

        Returns:
            Coordinated response with complete travel plan

        Example:
            query = "Plan a trip to Paris: flights from NYC June 1-10, hotel near Eiffel Tower, and a car rental"
            result = await coordinator.coordinate(query)
        """
        try:
            logger.info(f"Coordinating travel request: {user_query}")

            # Run the LangGraph workflow
            final_state = await self.graph.run(user_query)

            # Extract results
            result = {
                "success": True,
                "query": user_query,
                "response": final_state.get("final_response", ""),
                "agents_called": final_state.get("agents_called", []),
                "agent_results": {
                    "flight": final_state.get("flight_results", {}),
                    "hotel": final_state.get("hotel_results", {}),
                    "transport": final_state.get("transport_results", {})
                },
                "agent": "coordinator"
            }

            logger.info(f"Coordination complete. Called agents: {result['agents_called']}")

            return result

        except Exception as e:
            logger.error(f"Error in coordination: {e}")
            return {
                "success": False,
                "query": user_query,
                "error": str(e),
                "agent": "coordinator"
            }

    @traceable(name="coordinator_search_nearby_places", run_type="chain")
    async def search_nearby_places(
        self,
        request: NearbyPlacesRequest,
        mock_data_provider: Optional[Callable] = None
    ) -> NearbyPlacesResponse:
        """
        Search for nearby places using the MCP server via the agent's MCP client.

        This method delegates the MCP tool call to the agent's internal MCP client,
        keeping all MCP interactions centralized within the agent.

        Args:
            request: NearbyPlacesRequest with coordinates and place types
            mock_data_provider: Optional callable that returns mock data dict.
                               Signature: (latitude, longitude, place_types, radius_miles) -> dict

        Returns:
            NearbyPlacesResponse with places or error information
        """
        logger.info(f"Agent searching nearby places at ({request.latitude}, {request.longitude})")

        return await self.mcp_client.search_nearby_places(
            request=request,
            mock_data_provider=mock_data_provider
        )


# Global agent instance
_coordinator_agent_instance = None


def get_coordinator_agent() -> CoordinatorAgent:
    """
    Get or create the global Coordinator Agent instance.

    Returns:
        CoordinatorAgent instance
    """
    global _coordinator_agent_instance
    if _coordinator_agent_instance is None:
        _coordinator_agent_instance = CoordinatorAgent()
    return _coordinator_agent_instance
