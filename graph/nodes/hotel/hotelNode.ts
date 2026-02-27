import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { loadModel } from "../../../utils/agents/loadModel.js";
import { generator } from "../../../utils/agents/generator.js";
import type { HotelResults } from "../../../types/hotel/hotels.js";
import type { AgentStateType } from "../../state.js";
import type { Trip } from "../../../types/trip.js";
import { nanoid } from "nanoid";
import { searchNearbyPlaces } from "../../../tools/travel/searchNearbyPlaces.js";
import { validateAirportCode } from "../../../tools/travel/validateAirport.js";

const USE_PLACES_API = process.env.USE_PLACES_API === "true";
const GENERATE_SUMMARIES = process.env.GENERATE_SUMMARIES === "true";

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

function createHotelTemplate(): HotelResults {
  return {
    id: nanoid(),
    name: null as unknown as string,
    location: null as unknown as string,
    rating: null as unknown as number,
    latitude: null as unknown as number,
    longitude: null as unknown as number,
    description: null as unknown as string,
    website: null as unknown as string,
    imageUrl: "",
  };
}

async function getDestinationCoords(
  trip: Trip,
): Promise<{ latitude: number; longitude: number } | null> {
  if (trip.destinationCoords) return trip.destinationCoords;
  if (!trip.destination) return null;
  try {
    const airport = await validateAirportCode(trip.destination);
    return {
      latitude: airport.latitude_deg,
      longitude: airport.longitude_deg,
    };
  } catch {
    return null;
  }
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

  try {
    let hotels: HotelResults[];

    if (USE_PLACES_API) {
      const coords = await getDestinationCoords(trip);

      if (!coords) {
        // No coordinates available, fall back to generator
        hotels = await generator<HotelResults>({
          data: Array.from({ length: 10 }, () => createHotelTemplate()),
          context: buildTripContext(trip),
          description: "hotel recommendations near the trip destination",
        });
      } else {
        hotels = (await searchNearbyPlaces({
          type: "hotel",
          latitude: coords.latitude,
          longitude: coords.longitude,
        })) as HotelResults[];
      }
    } else {
      hotels = await generator<HotelResults>({
        data: Array.from({ length: 5 }, () => createHotelTemplate()),
        context: buildTripContext(trip),
        description: "hotel recommendations near the trip destination",
      });
    }

    let summary = "";
    let aiMessage: AIMessage;
    if (GENERATE_SUMMARIES) {
      const summaryResponse = await model.invoke([
        new SystemMessage(`You are a helpful hotel assistant.
Briefly summarize these hotel recommendations in 2-3 sentences.
Be concise and helpful.`),
        new HumanMessage(JSON.stringify(hotels, null, 2)),
      ]);
      summary = summaryResponse.content as string;
      aiMessage = new AIMessage(summary);
    } else {
      aiMessage = new AIMessage("Here are your hotel recommendations.");
    }

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
