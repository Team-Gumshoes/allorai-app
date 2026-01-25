import { addMessages } from "@langchain/langgraph";
import { HumanMessage, AIMessage as AIMsg } from "@langchain/core/messages";
import type { BaseMessage, AIMessage } from "@langchain/core/messages";
import { callLlm } from "./callLlm.js";
import { callTool } from "./callTool.js";
import type { FlightResults } from "../../types/flights.js";
import { formatFlights } from "./utils/formatFlights.js";
import { summarizeFlights } from "./utils/summarizeFlights.js";
import { extractLastToolJson } from "../../utils/agents/extractLastToolJson.js";
import { hasToolOutput } from "../../utils/agents/hasToolOutput.js";

interface FlightAgentResults {
  flightData: FlightResults[];
  formattedFlights: string;
  summary: string;
  messages: BaseMessage[];
}

export async function runFlightAgent(
  input: BaseMessage[]
): Promise<
  FlightAgentResults | { needsClarification: string; messages: BaseMessage[] }
> {
  try {
    let messages = [...input];
    let modelResponse: AIMessage;
    let toolsCalledThisTurn = false;

    while (true) {
      modelResponse = await callLlm(messages);

      // Always record model response
      messages = addMessages(messages, [modelResponse]);

      // Stop when no tools were called
      if (!modelResponse.tool_calls?.length) break;

      toolsCalledThisTurn = true;

      // Call tools and record results
      const toolResults = await Promise.all(
        modelResponse.tool_calls.map(callTool)
      );

      messages = addMessages(messages, toolResults);
    }

    // No tool called this turn. Agent asks a followup question.
    if (!toolsCalledThisTurn) {
      const lastAiMessage = [...messages]
        .reverse()
        .find((m) => m.type === "ai");

      return {
        needsClarification: lastAiMessage?.text ?? "I need more details.",
        messages,
      };
    }

    // Post tool phase
    const flightData = extractLastToolJson<FlightResults[]>(messages);

    // Validate that we got proper flight data
    if (!Array.isArray(flightData) || flightData.length === 0) {
      const errorMessage = "Something went wrong. Please try again later.";
      const errorAiMessage = new AIMsg(errorMessage);

      return {
        needsClarification: errorMessage,
        messages: [...messages, errorAiMessage], // Include error message in conversation
      };
    }

    const formattedFlights = formatFlights(messages);
    const summary = await summarizeFlights(flightData, messages);

    return { flightData, formattedFlights, summary, messages };
  } catch (error) {
    // Catch any errors (API failures, parsing errors, etc.)
    // Don't log error details to user - they just need to know to try again
    // console.error("Flight agent error:", error);

    const errorMessage = "Something went wrong. Please try again later.";
    const errorAiMessage = new AIMsg(errorMessage);

    return {
      needsClarification: errorMessage,
      messages: [...input, errorAiMessage], // Include error message in conversation
    };
  }
}
