import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { model } from "../../../models/openAi.js";
import { generator } from "../../../utils/agents/generator.js";
import type { Sights } from "../../../types/sightseeing/sights.js";
import type { AgentStateType } from "../../state.js";
import type { Trip } from "../../../types/trip.js";

function getMissingFields(trip: Trip): string[] {
  const missing: string[] = [];
  if (!trip.destination) missing.push("destination");
  return missing;
}

function buildTripContext(trip: Trip): Record<string, unknown> {
  return {
    destination: trip.destination,
    origin: trip.origin,
    budget: trip.budget,
    hotel: trip.hotel,
    interests: trip.interests,
    constraints: trip.constraints,
  };
}

export async function sightseeingNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const trip = state.trip;
  const missingFields = getMissingFields(trip);

  // If destination is missing, ask for it
  if (missingFields.length > 0) {
    const response = await model.invoke([
      new SystemMessage(`You are a helpful sightseeing assistant.
You need the user's trip destination to recommend sightseeing locations.
Ask for the missing information concisely (1-2 sentences max).
Missing: ${missingFields.join(", ")}`),
      ...state.messages.slice(-6),
    ]);

    const aiMessage = new AIMessage(response.content as string);
    return { messages: [...state.messages, aiMessage] };
  }

  // Generate sightseeing recommendations
  try {
    const template: Sights = {
      name: null as unknown as string,
      location: null as unknown as string,
      description: null as unknown as string,
    };

    const sights = await generator<Sights>({
      data: [template, template, template, template, template],
      context: buildTripContext(trip),
      description: "sightseeing location recommendations near the trip destination",
    });

    // Generate a conversational summary
    const summaryResponse = await model.invoke([
      new SystemMessage(`You are a helpful sightseeing assistant.
Briefly summarize these sightseeing recommendations in 2-3 sentences.
Be concise and helpful.`),
      new HumanMessage(JSON.stringify(sights, null, 2)),
    ]);

    const summary = summaryResponse.content as string;
    const aiMessage = new AIMessage(summary);

    return {
      messages: [...state.messages, aiMessage],
      data: {
        type: "sightseeing",
        summary,
        options: sights,
      },
    };
  } catch (error) {
    const errorMessage = new AIMessage(
      "Something went wrong finding sightseeing locations. Please try again later.",
    );
    return { messages: [...state.messages, errorMessage] };
  }
}
