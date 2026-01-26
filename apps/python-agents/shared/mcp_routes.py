"""
Shared MCP routes for accessing MCP server tools and utilities.
These routes can be included in any FastAPI router.
"""

import logging
from fastapi import APIRouter, HTTPException

from shared.mcp_client import get_mcp_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mcp", tags=["mcp"])


@router.get("/tools")
async def list_mcp_tools():
    """
    List all available tools on the MCP server.

    Returns:
        Dictionary containing list of available MCP tools with their
        names, descriptions, and input schemas.
    """
    try:
        mcp = get_mcp_client()
        tools = await mcp.list_tools()
        return {"tools": tools}
    except Exception as e:
        logger.error(f"Error listing MCP tools: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def mcp_health_check():
    """
    Health check endpoint for MCP server connectivity.

    Returns:
        Status information about MCP server connection.
    """
    try:
        mcp = get_mcp_client()
        tools = await mcp.list_tools()
        return {
            "status": "healthy",
            "mcp_server_url": mcp.base_url,
            "tools_available": len(tools)
        }
    except Exception as e:
        logger.error(f"MCP health check failed: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "mcp_server_url": get_mcp_client().base_url,
            "error": str(e)
        }
