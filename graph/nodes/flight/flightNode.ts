import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage, AIMessage } from "@langchain/core/messages";
import { model } from "../../../models/openAi.js";
import { flightTools } from "./tools.js";
import { summarizeFlights } from "./utils/summarizeFlights.js";
import { extractLastToolJson } from "../../../utils/agents/extractLastToolJson.js";
import type { FlightResults } from "../../../types/flight/flights.js";
import type { AgentStateType } from "../../state.js";
import type { Trip } from "../../../types/trip.js";

function getMissingFields(trip: Trip): string[] {
  const missing: string[] = [];
  if (!trip.origin) missing.push("origin city/airport");
  if (!trip.destination) missing.push("destination city/airport");
  if (!trip.departureDate) missing.push("departure date");
  if (!trip.returnDate) missing.push("return date");
  return missing;
}

function buildSystemPrompt(trip: Trip): string {
  const missingFields = getMissingFields(trip);
  const tripContext = `
Current trip details:
- Origin: ${trip.origin || "not specified"}
- Destination: ${trip.destination || "not specified"}
- Departure date: ${trip.departureDate || "not specified"}
- Return date: ${trip.returnDate || "not specified"}
- Budget: ${trip.budget ? `$${trip.budget}` : "not specified"}

${missingFields.length > 0 ? `Missing required information: ${missingFields.join(", ")}` : "All required flight information is available."}
`;

  return `
You are a helpful flight research assistant helping plan a trip.

${tripContext}

You can search for round-trip flights using the tools available to you.
Each tool has specific required parameters - review them carefully.

Rules:
- If required trip information is missing, ask for it ONE piece at a time.
- Prioritize missing fields in this order: origin, destination, departure date, return date.
- When you have all required info, search for flights.
- You MUST use tools to get flight data.
- You MUST NOT invent or guess flight information.
- Be CONCISE. Keep responses short (1-2 sentences max).
- Do NOT format or present detailed results to the user (that's handled separately).
- If the user provides an airline, convert the airline name to its 2-character IATA code.
`;
}

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
  const trip = state.trip;

  try {
    const flightAgent = createReactAgent({
      llm: model,
      tools: flightTools,
      messageModifier: new SystemMessage(buildSystemPrompt(trip)),
    });

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

    // Summarize the flights
    const summary = await summarizeFlights(flightData, result.messages);
    const finalMessage = new AIMessage(summary);

    // Return updated state with data extracted
    return {
      messages: [...result.messages, finalMessage],
      data: {
        type: "flight",
        summary: summary,
        options: flightData,
      },
    };
  } catch (error) {
    const errorMessage = new AIMessage(
      "Something went wrong. Please try again later.",
    );
    return { messages: [...currentMessages, errorMessage] };
  }
}
