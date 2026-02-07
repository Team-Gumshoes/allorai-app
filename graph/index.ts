import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { routerNode, routeByIntent } from "./nodes/supervisor/router.js";
import { arithmeticNode } from "./nodes/arithmetic/arithmeticNode.js";
import { flightNode } from "./nodes/flight/flightNode.js";
import { unsupportedNode } from "./nodes/unsupportedNode.js";

/**
 * Multi-agent graph using LangGraph.
 *
 * Architecture:
 *   START -> router -> [arithmeticAgent | flightAgent | unsupportedNode] -> END
 *
 * The router classifies intent and routes to the appropriate agent node.
 * Each agent node handles its domain and returns updated messages.
 *
 * To add a new agent:
 * 1. Add intent to types/intents.ts
 * 2. Update classifyIntent.ts prompt
 * 3. Add case to routeByIntent() in nodes/router.ts
 * 4. Create agent node in nodes/
 * 5. Add node and edge below
 */
const workflow = new StateGraph(AgentState)
  // Add nodes
  .addNode("router", routerNode)
  .addNode("arithmeticAgent", arithmeticNode)
  .addNode("flightAgent", flightNode)
  .addNode("unsupportedNode", unsupportedNode)
  // Add edges
  .addEdge(START, "router")
  .addConditionalEdges("router", routeByIntent)
  .addEdge("arithmeticAgent", END)
  .addEdge("flightAgent", END)
  .addEdge("unsupportedNode", END);

export const graph = workflow.compile();
