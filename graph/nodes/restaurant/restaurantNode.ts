import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { loadModel } from "../../../utils/agents/loadModel.js";
import { generator } from "../../../utils/agents/generator.js";
import type { RestaurantResults } from "../../../types/restaurant/restaurants.js";
import type { AgentStateType } from "../../state.js";
import type { Trip } from "../../../types/trip.js";
import { nanoid } from "nanoid";
import { searchNearbyPlaces } from "../../../tools/travel/searchNearbyPlaces.js";

const USE_PLACES_API = process.env.USE_PLACES_API === "true";

const model = loadModel("smart");

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

function createRestaurantTemplate(): RestaurantResults {
  return {
    id: nanoid(),
    name: null as unknown as string,
    location: null as unknown as string,
    description: null as unknown as string,
    website: null as unknown as string,
  };
}

export async function restaurantNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const trip = state.trip;
  const missingFields = getMissingFields(trip);

  // If destination is missing, ask for it
  if (missingFields.length > 0) {
    const response = await model.invoke([
      new SystemMessage(`You are a helpful restaurant assistant.
You need the user's trip destination to recommend restaurants.
Ask for the missing information concisely (1-2 sentences max).
Missing: ${missingFields.join(", ")}`),
      ...state.messages.slice(-6),
    ]);

    const aiMessage = new AIMessage(response.content as string);
    return { messages: [...state.messages, aiMessage] };
  }

  try {
    let restaurants: RestaurantResults[];

    if (USE_PLACES_API && trip.hotelCoords) {
      restaurants = (await searchNearbyPlaces({
        type: "restaurant",
        latitude: trip.hotelCoords.latitude,
        longitude: trip.hotelCoords.longitude,
      })) as RestaurantResults[];
    } else {
      restaurants = await generator<RestaurantResults>({
        data: Array.from({ length: 3 }, () => createRestaurantTemplate()),
        context: buildTripContext(trip),
        description: "restaurant recommendations near the trip destination",
      });
    }

    // Generate a conversational summary
    const summaryResponse = await model.invoke([
      new SystemMessage(`You are a helpful restaurant assistant.
Briefly summarize these restaurant recommendations in 2-3 sentences.
Be concise and helpful.`),
      new HumanMessage(JSON.stringify(restaurants, null, 2)),
    ]);

    const summary = summaryResponse.content as string;
    const aiMessage = new AIMessage(summary);

    return {
      messages: [...state.messages, aiMessage],
      data: {
        type: "restaurant",
        summary,
        options: restaurants,
      },
    };
  } catch (error) {
    const errorMessage = new AIMessage(
      "Something went wrong finding restaurants. Please try again later.",
    );
    return { messages: [...state.messages, errorMessage] };
  }
}
