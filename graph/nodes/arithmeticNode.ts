import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { model } from "../../models/openAi.js";
import { arithmeticTools } from "../../agents/arithmeticAgent/tools.js";
import type { AgentStateType } from "../state.js";

const arithmeticSystemPrompt = `
You are a helpful arithmetic assistant.

You can help with basic arithmetic between TWO numbers:
- Addition
- Subtraction
- Multiplication
- Division

Rules:
- You MUST use the provided tools for all calculations.
- You MUST NOT calculate results yourself.
- Be CONCISE. Keep responses short (1-2 sentences max).
- If missing info, ask for ONLY what's needed. Example: "What's the second number?"
- If the user asks for unsupported operations (derivatives, square roots, exponents,
  variables, 3+ numbers), briefly say you can only do basic arithmetic with 2 numbers.
- Review conversation history before asking - they may have already provided some info.
`;

/* NOTE: Keep the deprecated createReactAgent function.
 * The createAgent function mentioned in the documentation does not exist on "langchain"
 * and multiple errors get made when upgrading the current langchain packages.
 */
const arithmeticAgent = createReactAgent({
  llm: model,
  tools: arithmeticTools,
  messageModifier: new SystemMessage(arithmeticSystemPrompt),
});

/**
 * Arithmetic agent node that handles math operations.
 * Uses createReactAgent which handles the tool-calling loop automatically.
 */
export async function arithmeticNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const result = await arithmeticAgent.invoke({ messages: state.messages });
  return { messages: result.messages };
}
