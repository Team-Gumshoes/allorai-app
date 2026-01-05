"""
Hotel Agent implementation using LangChain.
Handles hotel search and booking queries.
"""

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
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

        # Create prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", HOTEL_SYSTEM_PROMPT),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        # Create agent
        self.agent = create_openai_tools_agent(
            llm=self.llm,
            tools=hotel_tools,
            prompt=self.prompt
        )

        # Create agent executor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=hotel_tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=5
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

            result = await self.agent_executor.ainvoke({
                "input": query
            })

            logger.info("Hotel query processed successfully")

            return {
                "success": True,
                "query": query,
                "response": result.get("output", ""),
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
