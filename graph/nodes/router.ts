import { classifyIntent } from "../../agents/managerAgent/classifyIntent.js";
import type { AgentStateType } from "../state.js";

/**
 * Router node that classifies the user's intent.
 * Uses the existing classifyIntent function to determine which agent to route to.
 */
export async function routerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const intent = await classifyIntent(state.messages);
  return { intent };
}

/**
 * Conditional edge function that routes based on classified intent.
 * To add a new agent:
 * 1. Add the intent to types/intents.ts
 * 2. Update classifyIntent.ts prompt
 * 3. Add a case here
 * 4. Create the agent node
 * 5. Wire into the graph
 */
export function routeByIntent(state: AgentStateType): string {
  const { intent } = state;

  switch (intent) {
    case "arithmetic":
      return "arithmeticAgent";
    case "flights":
      return "flightAgent";
    default:
      return "unsupportedNode";
  }
}
