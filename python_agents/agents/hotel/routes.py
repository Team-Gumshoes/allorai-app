"""
FastAPI routes for Hotel Agent.
Exposes HTTP endpoints for hotel search operations.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from agents.hotel.agent import get_hotel_agent
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hotel", tags=["hotel"])


class HotelSearchRequest(BaseModel):
    """Request model for hotel search."""
    query: str = Field(..., description="Natural language hotel search query")
    location: Optional[str] = Field(None, description="Hotel location")
    check_in: Optional[str] = Field(None, description="Check-in date (YYYY-MM-DD)")
    check_out: Optional[str] = Field(None, description="Check-out date (YYYY-MM-DD)")
    guests: Optional[int] = Field(2, description="Number of guests")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "Find me a hotel in Paris for 2 nights",
                "location": "Paris",
                "check_in": "2024-06-01",
                "check_out": "2024-06-03",
                "guests": 2
            }
        }


class HotelSearchResponse(BaseModel):
    """Response model for hotel search."""
    success: bool
    query: str
    response: Optional[str] = None
    error: Optional[str] = None
    agent: str = "hotel"


@router.post("/search", response_model=HotelSearchResponse)
async def search_hotels(request: HotelSearchRequest):
    """
    Search for hotels using natural language query.

    The agent will parse the query and use available tools to search for hotels
    based on the provided criteria.

    Args:
        request: Hotel search request with query and optional parameters

    Returns:
        Hotel search results processed by the agent

    Raises:
        HTTPException: If the search fails
    """
    try:
        logger.info(f"Received hotel search request: {request.query}")

        # Get hotel agent
        agent = get_hotel_agent()

        # Process query
        result = await agent.process_query(request.query)

        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))

        return HotelSearchResponse(**result)

    except Exception as e:
        logger.error(f"Hotel search endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Health check endpoint for hotel agent.

    Returns:
        Status information
    """
    return {
        "status": "healthy",
        "agent": "hotel",
        "service": "python_agents"
    }
