import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { model } from "../../../models/openAi.js";
import { generator } from "../../../utils/agents/generator.js";
import type { HotelResults } from "../../../types/hotel/hotels.js";
import type { AgentStateType } from "../../state.js";
import type { Trip } from "../../../types/trip.js";
import { nanoid } from "nanoid";

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

function createHotelTemplate(): HotelResults {
  return {
    id: nanoid(),
    name: null as unknown as string,
    location: null as unknown as string,
    num_of_stars: null as unknown as number,
    price: null as unknown as number,
  };
}

export async function hotelNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const trip = state.trip;
  const missingFields = getMissingFields(trip);

  // If destination is missing, ask for it
  if (missingFields.length > 0) {
    const response = await model.invoke([
      new SystemMessage(`You are a helpful hotel assistant.
You need the user's trip destination to recommend hotels.
Ask for the missing information concisely (1-2 sentences max).
Missing: ${missingFields.join(", ")}`),
      ...state.messages.slice(-6),
    ]);

    const aiMessage = new AIMessage(response.content as string);
    return { messages: [...state.messages, aiMessage] };
  }

  // Generate hotel recommendations
  try {
    const hotels = await generator<HotelResults>({
      // data: [template, template, template, template, template],
      data: Array.from({ length: 5 }, () => createHotelTemplate()),
      context: buildTripContext(trip),
      description: "hotel recommendations near the trip destination",
    });

    // Generate a conversational summary
    const summaryResponse = await model.invoke([
      new SystemMessage(`You are a helpful hotel assistant.
Briefly summarize these hotel recommendations in 2-3 sentences.
Be concise and helpful.`),
      new HumanMessage(JSON.stringify(hotels, null, 2)),
    ]);

    const summary = summaryResponse.content as string;
    const aiMessage = new AIMessage(summary);

    return {
      messages: [...state.messages, aiMessage],
      data: {
        type: "hotel",
        summary,
        options: hotels,
      },
    };
  } catch (error) {
    const errorMessage = new AIMessage(
      "Something went wrong finding hotels. Please try again later.",
    );
    return { messages: [...state.messages, errorMessage] };
  }
}
