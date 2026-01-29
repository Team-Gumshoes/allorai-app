"""
LangGraph StateGraph implementation for the Coordinator Agent.
Manages state and orchestrates the workflow of delegating to specialized agents.
"""

from typing import TypedDict, Annotated, Sequence, List, Dict, Any
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from agents.coordinator.tools import coordinator_tools
from agents.coordinator.prompts import COORDINATOR_SYSTEM_PROMPT
from shared.config import settings
import logging

logger = logging.getLogger(__name__)


class CoordinatorState(TypedDict):
    """
    State for the coordinator agent graph.

    Tracks the conversation history, user query, and results from delegated agents.
    """
    # Conversation messages with add_messages reducer
    messages: Annotated[Sequence[BaseMessage], add_messages]

    # Original user query
    user_query: str

    # Results from delegated agents
    flight_results: Dict[str, Any]
    hotel_results: Dict[str, Any]
    transport_results: Dict[str, Any]

    # Final synthesized response
    final_response: str

    # Tracking which agents were called
    agents_called: List[str]


class CoordinatorGraph:
    """
    LangGraph StateGraph for coordinating travel planning across multiple agents.

    Workflow:
    1. Analyze user query to determine which agents are needed
    2. Delegate to appropriate agents (flight, hotel, transport)
    3. Collect and synthesize responses
    4. Return comprehensive travel plan to user
    """

    def __init__(self):
        """Initialize the Coordinator Graph with LLM and tools."""
        self.llm = ChatOpenAI(
            model=settings.openai_model,
            temperature=settings.temperature,
            api_key=settings.openai_api_key
        )

        # Bind tools to LLM for function calling
        self.llm_with_tools = self.llm.bind_tools(coordinator_tools)

        # Create the state graph
        self.graph = self._create_graph()

        logger.info("Coordinator Graph initialized")

    def _create_graph(self) -> StateGraph:
        """
        Create the LangGraph StateGraph with nodes and edges.

        Returns:
            Compiled StateGraph
        """
        # Create new graph
        workflow = StateGraph(CoordinatorState)

        # Add nodes
        workflow.add_node("analyze_query", self._analyze_query_node)
        workflow.add_node("delegate_agents", self._delegate_agents_node)
        workflow.add_node("synthesize_response", self._synthesize_response_node)

        # Set entry point
        workflow.set_entry_point("analyze_query")

        # Add edges
        workflow.add_edge("analyze_query", "delegate_agents")
        workflow.add_edge("delegate_agents", "synthesize_response")
        workflow.add_edge("synthesize_response", END)

        # Compile the graph
        return workflow.compile()

    async def _analyze_query_node(self, state: CoordinatorState) -> CoordinatorState:
        """
        Analyze the user query to determine which agents to delegate to.

        This node examines the user's request and decides whether it needs
        flight, hotel, or transport agents (or a combination).

        Args:
            state: Current coordinator state

        Returns:
            Updated state with analysis
        """
        logger.info("Analyzing user query")

        # Get user query from state
        user_query = state.get("user_query", "")

        # Create analysis prompt
        analysis_prompt = f"""Analyze this travel planning request: "{user_query}"

Determine which specialized agents are needed:
- Flight Agent: For flight searches and bookings
- Hotel Agent: For accommodation searches
- Transport Agent: For car rentals, trains, local transport

Respond with a brief analysis of what the user needs."""

        # Get analysis from LLM
        messages = [
            SystemMessage(content=COORDINATOR_SYSTEM_PROMPT),
            HumanMessage(content=analysis_prompt)
        ]

        response = await self.llm.ainvoke(messages)

        # Update state with analysis
        state["messages"] = state.get("messages", []) + [
            HumanMessage(content=user_query),
            response
        ]

        logger.info(f"Query analysis complete: {response.content}")

        return state

    async def _delegate_agents_node(self, state: CoordinatorState) -> CoordinatorState:
        """
        Delegate tasks to appropriate specialized agents.

        Uses the LLM with bound tools to decide which agents to call
        and what queries to send them.

        Args:
            state: Current coordinator state

        Returns:
            Updated state with agent results
        """
        logger.info("Delegating to specialized agents")

        # Get current messages
        messages = state.get("messages", [])

        # Add delegation instruction
        delegation_msg = HumanMessage(content="""Now delegate to the appropriate agents to fulfill this request.
Use the available tools to call flight, hotel, or transport agents as needed.""")

        messages = messages + [delegation_msg]

        # Call LLM with tools to trigger delegation
        response = await self.llm_with_tools.ainvoke(messages)

        # Track which agents were called
        agents_called = state.get("agents_called", [])

        # Process tool calls if any
        if hasattr(response, "tool_calls") and response.tool_calls:
            logger.info(f"Tool calls requested: {len(response.tool_calls)}")

            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                logger.info(f"Executing tool: {tool_name}")

                # Find and execute the tool
                for tool in coordinator_tools:
                    if tool.name == tool_name:
                        result = await tool.ainvoke(tool_call["args"])

                        # Store results based on agent type
                        if "flight" in tool_name:
                            state["flight_results"] = result
                            agents_called.append("flight")
                        elif "hotel" in tool_name:
                            state["hotel_results"] = result
                            agents_called.append("hotel")
                        elif "transport" in tool_name:
                            state["transport_results"] = result
                            agents_called.append("transport")

                        break

        state["agents_called"] = agents_called
        state["messages"] = messages + [response]

        logger.info(f"Delegation complete. Agents called: {agents_called}")

        return state

    async def _synthesize_response_node(self, state: CoordinatorState) -> CoordinatorState:
        """
        Synthesize results from all agents into a comprehensive response.

        Combines flight, hotel, and transport results into a coherent
        travel plan for the user.

        Args:
            state: Current coordinator state

        Returns:
            Updated state with final response
        """
        logger.info("Synthesizing final response")

        # Gather all agent results
        flight_results = state.get("flight_results", {})
        hotel_results = state.get("hotel_results", {})
        transport_results = state.get("transport_results", {})

        # Create synthesis prompt
        synthesis_parts = ["Based on the following agent responses, create a comprehensive travel plan:\n"]

        if flight_results:
            synthesis_parts.append(f"Flight Agent Results: {flight_results.get('response', 'No results')}\n")

        if hotel_results:
            synthesis_parts.append(f"Hotel Agent Results: {hotel_results.get('response', 'No results')}\n")

        if transport_results:
            synthesis_parts.append(f"Transport Agent Results: {transport_results.get('response', 'No results')}\n")

        synthesis_parts.append("\nProvide a clear, organized summary of the complete travel plan.")

        synthesis_prompt = "".join(synthesis_parts)

        # Get synthesis from LLM
        messages = state.get("messages", []) + [HumanMessage(content=synthesis_prompt)]
        response = await self.llm.ainvoke(messages)

        # Store final response
        state["final_response"] = response.content
        state["messages"] = messages + [response]

        logger.info("Final response synthesized")

        return state

    async def run(self, user_query: str) -> Dict[str, Any]:
        """
        Run the coordinator graph with a user query.

        Args:
            user_query: User's travel planning request

        Returns:
            Final state with synthesized response
        """
        logger.info(f"Running coordinator graph for query: {user_query}")

        # Initialize state
        initial_state = CoordinatorState(
            messages=[],
            user_query=user_query,
            flight_results={},
            hotel_results={},
            transport_results={},
            final_response="",
            agents_called=[]
        )

        # Run the graph
        final_state = await self.graph.ainvoke(initial_state)

        logger.info("Coordinator graph execution complete")

        return final_state


# Global graph instance
_coordinator_graph_instance = None


def get_coordinator_graph() -> CoordinatorGraph:
    """
    Get or create the global Coordinator Graph instance.

    Returns:
        CoordinatorGraph instance
    """
    global _coordinator_graph_instance
    if _coordinator_graph_instance is None:
        _coordinator_graph_instance = CoordinatorGraph()
    return _coordinator_graph_instance
