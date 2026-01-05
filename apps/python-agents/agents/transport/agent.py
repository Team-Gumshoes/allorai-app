"""
Transport Agent implementation using LangChain.
Handles transport search queries (car rentals, trains, local transport).
"""

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
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

        # Create prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", TRANSPORT_SYSTEM_PROMPT),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        # Create agent
        self.agent = create_openai_tools_agent(
            llm=self.llm,
            tools=transport_tools,
            prompt=self.prompt
        )

        # Create agent executor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=transport_tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=5
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

            result = await self.agent_executor.ainvoke({
                "input": query
            })

            logger.info("Transport query processed successfully")

            return {
                "success": True,
                "query": query,
                "response": result.get("output", ""),
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
