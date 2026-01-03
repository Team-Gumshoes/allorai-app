import { addMessages } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
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
}

export async function runFlightAgent(
  input: BaseMessage[]
): Promise<FlightAgentResults | { needsClarification: string }> {
  // let messages: BaseMessage[] = [new HumanMessage(input)];
  // let agentMessages = [...messages];
  let messages = [...input];
  let modelResponse: AIMessage;

  while (true) {
    modelResponse = await callLlm(messages);

    // Always record model response
    messages = addMessages(messages, [modelResponse]);

    // Stop when no tools were called
    if (!modelResponse.tool_calls?.length) break;

    // Call tool
    const toolResults = await Promise.all(
      modelResponse.tool_calls.map(callTool)
    );

    // Record tool results
    messages = addMessages(messages, [modelResponse, ...toolResults]);
    // modelResponse = await callLlm(messages);
  }

  // No tool called. Agent asks a followup question.
  if (!messages.some((m) => m.type === "tool")) {
    const lastAiMessage = [...messages].reverse().find((m) => m.type === "ai");

    return {
      needsClarification: lastAiMessage?.text ?? "I need more details.",
    };
  }

  // console.log(messages);

  // Post tool phase
  const flightData = extractLastToolJson<FlightResults[]>(messages); // Assumes last tool called was findCheapestFlights
  const formattedFlights = formatFlights(messages);
  const summary = await summarizeFlights(flightData, messages);

  return { flightData, formattedFlights, summary };
}
