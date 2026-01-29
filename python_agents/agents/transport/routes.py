"""
FastAPI routes for Transport Agent.
Exposes HTTP endpoints for transport search operations.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from agents.transport.agent import get_transport_agent
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transport", tags=["transport"])


class TransportSearchRequest(BaseModel):
    """Request model for transport search."""
    query: str = Field(..., description="Natural language transport search query")
    origin: Optional[str] = Field(None, description="Origin location")
    destination: Optional[str] = Field(None, description="Destination location")
    travel_date: Optional[str] = Field(None, description="Travel date (YYYY-MM-DD)")
    transport_type: Optional[str] = Field(None, description="Transport type (car, train, local)")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "Find me a car rental in Paris for next week",
                "origin": "Paris",
                "travel_date": "2024-06-01",
                "transport_type": "car"
            }
        }


class TransportSearchResponse(BaseModel):
    """Response model for transport search."""
    success: bool
    query: str
    response: Optional[str] = None
    error: Optional[str] = None
    agent: str = "transport"


@router.post("/search", response_model=TransportSearchResponse)
async def search_transport(request: TransportSearchRequest):
    """
    Search for transport options using natural language query.

    The agent will parse the query and use available tools to search for
    car rentals, trains, or local transport based on the provided criteria.

    Args:
        request: Transport search request with query and optional parameters

    Returns:
        Transport search results processed by the agent

    Raises:
        HTTPException: If the search fails
    """
    try:
        logger.info(f"Received transport search request: {request.query}")

        # Get transport agent
        agent = get_transport_agent()

        # Process query
        result = await agent.process_query(request.query)

        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))

        return TransportSearchResponse(**result)

    except Exception as e:
        logger.error(f"Transport search endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Health check endpoint for transport agent.

    Returns:
        Status information
    """
    return {
        "status": "healthy",
        "agent": "transport",
        "service": "python_agents"
    }
