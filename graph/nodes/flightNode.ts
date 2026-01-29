import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage, AIMessage } from "@langchain/core/messages";
import { model } from "../../models/openAi.js";
import { flightTools } from "../../agents/flightAgent/tools.js";
import { formatFlights } from "../../agents/flightAgent/utils/formatFlights.js";
import { summarizeFlights } from "../../agents/flightAgent/utils/summarizeFlights.js";
import { extractLastToolJson } from "../../utils/agents/extractLastToolJson.js";
import type { FlightResults } from "../../types/flights.js";
import type { AgentStateType } from "../state.js";

const flightSystemPrompt = `
You are a helpful flight research assistant.

You can search for round-trip flights using the tools available to you.
Each tool has specific required parameters - review them carefully.

Rules:
- You handle ONE flight search at a time.
- If the user changes parameters or asks about a different route, use the NEW
  parameters and replace the previous search (do NOT try to search for both).
- You MUST use tools to get flight data.
- You MUST NOT invent or guess flight information.
- Be CONCISE. Keep responses short (1-2 sentences max).
- If missing required info, ask for ONLY what's needed. Example: "What's your departure date (YYYY-MM-DD)?"
- Ask for ONE piece of missing information at a time.
- Only ask for information required by your tools, not preferences.
- Review conversation history - the user may have already provided some details.
- Do NOT format or present results to the user (that's handled separately).
- If the user provides an airline, convert the airline name to it's 2-character IATA code.
`;

/* NOTE: Keep the deprecated createReactAgent function.
 * The createAgent function mentioned in the documentation does not exist on "langchain"
 * and multiple errors get made when upgrading the current langchain packages.
 */
const flightAgent = createReactAgent({
  llm: model,
  tools: flightTools,
  messageModifier: new SystemMessage(flightSystemPrompt),
});

/**
 * Flight agent node that handles flight searches.
 * Uses createReactAgent for tool-calling, then applies post-processing
 * to format and summarize flight results.
 */
export async function flightNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const inputMessageCount = state.messages.length;
  let currentMessages = state.messages;

  try {
    const result = await flightAgent.invoke({ messages: state.messages });
    currentMessages = result.messages;

    // Check if tools were called THIS turn by looking at new messages only
    const newMessages = result.messages.slice(inputMessageCount);
    const toolsCalledThisTurn = newMessages.some((m) => m.type === "tool");

    // If no tools were called, the agent is asking for clarification
    if (!toolsCalledThisTurn) {
      return { messages: result.messages };
    }

    // Post-process flight results
    const flightData = extractLastToolJson<FlightResults[]>(result.messages);

    // Validate flight data
    if (!Array.isArray(flightData) || flightData.length === 0) {
      const errorMessage = new AIMessage(
        "Something went wrong. Please try again later.",
      );
      return { messages: [...result.messages, errorMessage] };
    }

    // Format and summarize the flights
    const formattedFlights = formatFlights(result.messages);
    const summary = await summarizeFlights(flightData, result.messages);

    // Create final response with summary and formatted flights
    const finalMessage = new AIMessage(`${summary}\n\n${formattedFlights}`);

    return { messages: [...result.messages, finalMessage] };
  } catch (error) {
    // Handle any errors gracefully
    // Use currentMessages to preserve any messages added before the error
    const errorMessage = new AIMessage(
      "Something went wrong. Please try again later.",
    );
    return { messages: [...currentMessages, errorMessage] };
  }
}
