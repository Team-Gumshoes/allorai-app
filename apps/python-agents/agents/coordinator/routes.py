"""
FastAPI routes for Coordinator Agent.
Exposes HTTP endpoints for coordinated travel planning.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from agents.coordinator.agent import get_coordinator_agent
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/coordinate", tags=["coordinator"])


class CoordinateRequest(BaseModel):
    """Request model for travel coordination."""
    query: str = Field(..., description="Complex travel planning query")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "Plan a trip to Paris from New York, June 1-10. I need flights, a hotel near the Eiffel Tower under $200/night, and a car rental."
            }
        }


class CoordinateResponse(BaseModel):
    """Response model for travel coordination."""
    success: bool
    query: str
    response: Optional[str] = None
    agents_called: List[str] = []
    agent_results: Dict[str, Any] = {}
    error: Optional[str] = None
    agent: str = "coordinator"


@router.post("", response_model=CoordinateResponse)
async def coordinate_travel_plan(request: CoordinateRequest):
    """
    Coordinate a complex travel planning request across multiple agents.

    This endpoint serves as the main entry point for comprehensive travel planning.
    The coordinator will:
    1. Analyze the request to identify needed services (flights, hotels, transport)
    2. Delegate to appropriate specialized agents
    3. Synthesize responses into a comprehensive travel plan

    The coordinator can handle complex, multi-part requests like:
    - "Plan a trip to Paris: flights from NYC, hotel, and car rental"
    - "I need a complete travel package to Tokyo with all arrangements"
    - "Book everything for my London trip next month"

    Args:
        request: Travel coordination request with complex query

    Returns:
        Comprehensive travel plan with results from all relevant agents

    Raises:
        HTTPException: If coordination fails
    """
    try:
        logger.info(f"Received coordination request: {request.query}")

        # Get coordinator agent
        coordinator = get_coordinator_agent()

        # Coordinate the request
        result = await coordinator.coordinate(request.query)

        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))

        return CoordinateResponse(**result)

    except Exception as e:
        logger.error(f"Coordination endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Health check endpoint for coordinator agent.

    Returns:
        Status information
    """
    return {
        "status": "healthy",
        "agent": "coordinator",
        "service": "python-agents",
        "capabilities": ["flight_delegation", "hotel_search", "transport_search", "multi_agent_coordination"]
    }
