"""
Hotel Agent implementation using LangChain.
Handles hotel search and booking queries.
"""

from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from agents.hotel.tools import hotel_tools
from agents.hotel.prompts import HOTEL_SYSTEM_PROMPT
from shared.config import settings
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class HotelAgent:
    """LangChain agent for hotel search and booking operations."""

    def __init__(self):
        """Initialize the Hotel Agent with LLM and tools."""
        # Initialize LLM
        self.llm = ChatOpenAI(
            model=settings.openai_model,
            temperature=settings.temperature,
            api_key=settings.openai_api_key
        )

        # Create agent using langgraph's create_react_agent
        self.agent = create_react_agent(
            model=self.llm,
            tools=hotel_tools,
            state_modifier=HOTEL_SYSTEM_PROMPT
        )

        logger.info("Hotel Agent initialized successfully")

    async def process_query(self, query: str) -> Dict[str, Any]:
        """
        Process a hotel-related query.

        Args:
            query: User's hotel search or booking query

        Returns:
            Agent response with hotel information
        """
        try:
            logger.info(f"Processing hotel query: {query}")

            result = await self.agent.ainvoke({
                "messages": [{"role": "user", "content": query}]
            })

            # Extract the last AI message as the response
            messages = result.get("messages", [])
            response = messages[-1].content if messages else ""

            logger.info("Hotel query processed successfully")

            return {
                "success": True,
                "query": query,
                "response": response,
                "agent": "hotel"
            }

        except Exception as e:
            logger.error(f"Error processing hotel query: {e}")
            return {
                "success": False,
                "query": query,
                "error": str(e),
                "agent": "hotel"
            }


# Global agent instance
_hotel_agent_instance = None


def get_hotel_agent() -> HotelAgent:
    """
    Get or create the global Hotel Agent instance.

    Returns:
        HotelAgent instance
    """
    global _hotel_agent_instance
    if _hotel_agent_instance is None:
        _hotel_agent_instance = HotelAgent()
    return _hotel_agent_instance
