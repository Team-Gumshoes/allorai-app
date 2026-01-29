"""
Food Agent API Routes - Foodie recommendation endpoints.
"""

import logging
from typing import Optional, List

from fastapi import APIRouter, Query, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from shared.mcp_client import get_mcp_client, NearbyPlacesRequest, NearbyPlacesResponse
from agents.food.agent import get_food_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/food", tags=["foodie"])


# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    context: Optional[list[dict]] = None


class SearchRequest(BaseModel):
    query: str
    location: Optional[str] = None
    cuisine_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_miles: float = Field(default=2.0, description="Search radius in miles")
    place_types: Optional[List[str]] = Field(
        default=None,
        description="List of place types to search for (default: ['restaurant', 'cafe'])"
    )

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "query": "best Italian restaurants",
                    "location": "Manhattan, NYC",
                    "cuisine_type": "Italian",
                    "latitude": 40.7128,
                    "longitude": -74.0060,
                    "radius_miles": 2.0,
                    "place_types": ["restaurant", "cafe"]
                },
                {
                    "query": "vegan food near me",
                    "latitude": 34.0522,
                    "longitude": -118.2437,
                    "radius_miles": 1.5,
                    "place_types": ["restaurant"]
                },
                {
                    "query": "sushi restaurants",
                    "location": "Tokyo",
                    "latitude": 35.6762,
                    "longitude": 139.6503,
                    "place_types": ["restaurant"]
                }
            ]
        }


class ChatResponse(BaseModel):
    response: str


class SearchResponse(BaseModel):
    source: str
    tools_used: list[str] = []
    query: str
    search_params: dict
    results: str | list | dict


class EvalRequest(BaseModel):
    dataset_name: str = "food-agent-eval"
    experiment_prefix: str = "food-agent"
    use_llm_judge: bool = False


@router.get("/health")
async def health_check():
    """
    Health check endpoint for the Foodie Agent.
    """
    logger.info("Health check requested for Foodie Agent.")
    return {
        "status": "healthy",
        "agent": "foodie",
        "version": "1.0.0"
    }


@router.get("/greet")
async def greet_user(name: str = Query(..., description="Name of the user to greet")):
    """
    Greet a user using the MCP server.
    """
    try:
        agent = get_food_agent()
        result = await agent.greet(name)
        return {"result": result}
    except Exception as e:
        logger.error(f"Error greeting user: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=SearchResponse)
async def search_food(request: SearchRequest):
    """
    Search for food recommendations near a location.

    Examples:
    - Search by coordinates: {"query": "pizza", "latitude": 40.7128, "longitude": -74.0060, "radius_miles": 2.0, "place_types": ["restaurant"]}
    - Search by location name: {"query": "sushi", "location": "San Francisco"}
    - Combined search: {"query": "Italian", "location": "NYC", "latitude": 40.7128, "longitude": -74.0060, "place_types": ["restaurant", "cafe"]}
    """
    try:
        agent = get_food_agent()
        result = await agent.search_food(
            query=request.query,
            location=request.location,
            cuisine_type=request.cuisine_type,
            latitude=request.latitude,
            longitude=request.longitude,
            radius_miles=request.radius_miles,
            place_types=request.place_types,
        )
        return SearchResponse(
            source=result["source"],
            tools_used=result.get("tools_used", []),
            query=result["query"],
            search_params=result["search_params"],
            results=result["results"],
        )
    except Exception as e:
        logger.error(f"Error searching for food: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nearby-places", response_model=NearbyPlacesResponse)
async def find_nearby_food_places(request: NearbyPlacesRequest):
    """
    Find food places nearby using the Places API.

    This endpoint directly calls the MCP search_nearby_places tool with
    food-related place types.

    Request body:
    {
        "latitude": 48.8584,
        "longitude": 2.2945,
        "place_types": ["restaurant", "cafe"],
        "radius_miles": 2.0
    }

    Args:
        request: NearbyPlacesRequest with coordinates and place types

    Returns:
        NearbyPlacesResponse with nearby food places
    """
    try:
        logger.info(f"Nearby food places request: {request}")

        agent = get_food_agent()
        response = await agent.search_nearby_places(
            latitude=request.latitude,
            longitude=request.longitude,
            place_types=request.get_place_types_list(),
            radius_miles=request.radius_miles,
            use_mock=request.use_mock,
        )

        return response

    except Exception as e:
        logger.error(f"Error finding nearby food places: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=ChatResponse)
async def chat_with_foodie(request: ChatRequest):
    """
    Chat with the foodie agent for recommendations.
    """
    try:
        agent = get_food_agent()
        response = await agent.chat(
            message=request.message,
            context=request.context,
        )
        return ChatResponse(response=response)
    except Exception as e:
        logger.error(f"Error chatting with foodie agent: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend", response_model=ChatResponse)
async def get_recommendation(
    query: str = Query(..., description="What kind of food recommendation do you want?")
):
    """
    Get a quick food recommendation.
    """
    try:
        agent = get_food_agent()
        response = await agent.get_recommendation(query)
        return ChatResponse(response=response)
    except Exception as e:
        logger.error(f"Error getting recommendation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Evaluation Endpoints
# ============================================================================

@router.post("/evals/create-dataset")
async def create_eval_dataset(dataset_name: str = "food-agent-eval"):
    """
    Create the evaluation dataset in LangSmith.
    """
    try:
        from agents.food.evals import create_eval_dataset as create_dataset
        dataset_id = create_dataset(dataset_name)
        return {
            "status": "success",
            "message": f"Dataset '{dataset_name}' created/updated",
            "dataset_id": str(dataset_id)
        }
    except Exception as e:
        logger.error(f"Error creating eval dataset: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evals/run")
async def run_evaluation(request: EvalRequest, background_tasks: BackgroundTasks):
    """
    Run evaluation on the food agent.
    Runs in background and results are available in LangSmith.
    """
    try:
        from agents.food.evals import run_evaluation as eval_run, run_evaluation_with_llm_judge

        def run_eval():
            if request.use_llm_judge:
                run_evaluation_with_llm_judge(request.dataset_name, request.experiment_prefix)
            else:
                eval_run(request.dataset_name, request.experiment_prefix)

        background_tasks.add_task(run_eval)

        return {
            "status": "started",
            "message": f"Evaluation started in background. Check LangSmith for results.",
            "dataset": request.dataset_name,
            "experiment_prefix": request.experiment_prefix,
            "use_llm_judge": request.use_llm_judge
        }
    except Exception as e:
        logger.error(f"Error running evaluation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
