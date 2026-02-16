import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { routerNode, routeByIntent } from "./nodes/supervisor/router.js";
import { arithmeticNode } from "./nodes/arithmetic/arithmeticNode.js";
import { flightNode } from "./nodes/flight/flightNode.js";
import { hotelNode } from "./nodes/hotel/hotelNode.js";
import { restaurantNode } from "./nodes/restaurant/restaurantNode.js";
import { selfieNode } from "./nodes/selfie/selfieNode.js";
import { activityNode } from "./nodes/activities/activityNode.js";
import { natureNode } from "./nodes/nature/natureNode.js";
import { unsupportedNode } from "./nodes/unsupportedNode.js";

/**
 * Multi-agent graph using LangGraph.
 *
 * Architecture:
 *   START -> router -> [arithmeticAgent | flightAgent | hotelAgent | restaurantAgent | selfieAgent | activityAgent | natureAgent | unsupportedNode] -> END
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
  .addNode("hotelAgent", hotelNode)
  .addNode("restaurantAgent", restaurantNode)
  .addNode("selfieAgent", selfieNode)
  .addNode("activityAgent", activityNode)
  .addNode("natureAgent", natureNode)
  .addNode("unsupportedNode", unsupportedNode)
  // Add edges
  .addEdge(START, "router")
  .addConditionalEdges("router", routeByIntent)
  .addEdge("arithmeticAgent", END)
  .addEdge("flightAgent", END)
  .addEdge("hotelAgent", END)
  .addEdge("restaurantAgent", END)
  .addEdge("selfieAgent", END)
  .addEdge("activityAgent", END)
  .addEdge("natureAgent", END)
  .addEdge("unsupportedNode", END);

export const graph = workflow.compile();
