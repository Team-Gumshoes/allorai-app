"""
Main FastAPI application for Python Agents Service.

This service provides AI-powered travel planning agents using:
- FastAPI for HTTP endpoints
- LangChain for agent orchestration
- LangGraph for complex workflows
- OpenAI for LLM capabilities

Available agents:
- Hotel Agent: Search and book hotels
- Transport Agent: Search car rentals, trains, local transport
- Coordinator Agent: Orchestrate multi-agent travel planning

The coordinator can delegate to the TypeScript flight agent via HTTP.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import sys
from contextlib import asynccontextmanager

# Import routers
from agents.hotel.routes import router as hotel_router
from agents.transport.routes import router as transport_router
from agents.coordinator.routes import router as coordinator_router

# Import configuration
from shared.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info("Starting Python Agents Service")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Mock mode: {settings.use_mock_responses}")
    logger.info(f"OpenAI model: {settings.openai_model}")

    yield

    # Shutdown
    logger.info("Shutting down Python Agents Service")


# Create FastAPI application
app = FastAPI(
    title="Python Agents Service",
    description="AI-powered travel planning agents using LangChain and LangGraph",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled errors.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.environment == "development" else "An error occurred"
        }
    )


# Include routers
app.include_router(hotel_router, prefix="/api/v1")
app.include_router(transport_router, prefix="/api/v1")
app.include_router(coordinator_router, prefix="/api/v1")


@app.get("/")
async def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "python-agents",
        "version": "1.0.0",
        "status": "running",
        "agents": {
            "hotel": {
                "status": "active",
                "endpoint": "/api/v1/hotel"
            },
            "transport": {
                "status": "active",
                "endpoint": "/api/v1/transport"
            },
            "coordinator": {
                "status": "active",
                "endpoint": "/api/v1/coordinate"
            }
        },
        "environment": settings.environment,
        "mock_mode": settings.use_mock_responses
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for service monitoring.
    """
    return {
        "status": "healthy",
        "service": "python-agents",
        "version": "1.0.0"
    }


@app.get("/api/v1/info")
async def api_info():
    """
    API information and available endpoints.
    """
    return {
        "service": "Python Agents Service",
        "version": "1.0.0",
        "description": "AI-powered travel planning agents",
        "endpoints": {
            "hotel": {
                "search": "POST /api/v1/hotel/search",
                "health": "GET /api/v1/hotel/health",
                "description": "Search and book hotels"
            },
            "transport": {
                "search": "POST /api/v1/transport/search",
                "health": "GET /api/v1/transport/health",
                "description": "Search car rentals, trains, and local transport"
            },
            "coordinator": {
                "coordinate": "POST /api/v1/coordinate",
                "health": "GET /api/v1/coordinate/health",
                "description": "Coordinate multi-agent travel planning"
            }
        },
        "technologies": [
            "FastAPI",
            "LangChain",
            "LangGraph",
            "OpenAI",
            "Python 3.11"
        ]
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.service_port,
        reload=settings.environment == "development",
        log_level="info"
    )
