"""
Transport Agent implementation using LangChain.
Handles transport search queries (car rentals, trains, local transport).
"""

from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from agents.transport.tools import transport_tools
from agents.transport.prompts import TRANSPORT_SYSTEM_PROMPT
from shared.config import settings
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class TransportAgent:
    """LangChain agent for transport search operations."""

    def __init__(self):
        """Initialize the Transport Agent with LLM and tools."""
        # Initialize LLM
        self.llm = ChatOpenAI(
            model=settings.openai_model,
            temperature=settings.temperature,
            api_key=settings.openai_api_key
        )

        # Create agent using langgraph's create_react_agent
        self.agent = create_react_agent(
            model=self.llm,
            tools=transport_tools,
            state_modifier=TRANSPORT_SYSTEM_PROMPT
        )

        logger.info("Transport Agent initialized successfully")

    async def process_query(self, query: str) -> Dict[str, Any]:
        """
        Process a transport-related query.

        Args:
            query: User's transport search query

        Returns:
            Agent response with transport information
        """
        try:
            logger.info(f"Processing transport query: {query}")

            result = await self.agent.ainvoke({
                "messages": [{"role": "user", "content": query}]
            })

            # Extract the last AI message as the response
            messages = result.get("messages", [])
            response = messages[-1].content if messages else ""

            logger.info("Transport query processed successfully")

            return {
                "success": True,
                "query": query,
                "response": response,
                "agent": "transport"
            }

        except Exception as e:
            logger.error(f"Error processing transport query: {e}")
            return {
                "success": False,
                "query": query,
                "error": str(e),
                "agent": "transport"
            }


# Global agent instance
_transport_agent_instance = None


def get_transport_agent() -> TransportAgent:
    """
    Get or create the global Transport Agent instance.

    Returns:
        TransportAgent instance
    """
    global _transport_agent_instance
    if _transport_agent_instance is None:
        _transport_agent_instance = TransportAgent()
    return _transport_agent_instance
