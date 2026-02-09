import { AIMessage } from "@langchain/core/messages";
import type { AgentStateType } from "../state.js";

/**
 * Node that handles unsupported intents.
 * Returns a friendly message directing users to supported capabilities.
 */
export async function unsupportedNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const message = new AIMessage(
    "I can only help with helping you plan a trip. What would you like to do?",
  );

  return { messages: [...state.messages, message] };
}
