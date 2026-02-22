import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { loadModel } from "../../../utils/agents/loadModel.js";
import { generator } from "../../../utils/agents/generator.js";
import type { SelfieSpots } from "../../../types/selfie/selfieSpots.js";
import type { AgentStateType } from "../../state.js";
import type { Trip } from "../../../types/trip.js";
import { nanoid } from "nanoid";
import { searchNearbyPlaces } from "../../../tools/travel/searchNearbyPlaces.js";

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

function createSelfieTemplate(): SelfieSpots {
  return {
    id: nanoid(),
    name: null as unknown as string,
    location: null as unknown as string,
    description: null as unknown as string,
    website: null as unknown as string,
  };
}

export async function selfieNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const trip = state.trip;
  const missingFields = getMissingFields(trip);

  // If destination is missing, ask for it
  if (missingFields.length > 0) {
    const response = await model.invoke([
      new SystemMessage(`You are a helpful selfie spot assistant.
You need the user's trip destination to recommend good selfie spots.
Ask for the missing information concisely (1-2 sentences max).
Missing: ${missingFields.join(", ")}`),
      ...state.messages.slice(-6),
    ]);

    const aiMessage = new AIMessage(response.content as string);
    return { messages: [...state.messages, aiMessage] };
  }

  try {
    let selfieSpots: SelfieSpots[];

    if (USE_PLACES_API && trip.hotelCoords) {
      selfieSpots = (await searchNearbyPlaces({
        type: "selfie",
        latitude: trip.hotelCoords.latitude,
        longitude: trip.hotelCoords.longitude,
      })) as SelfieSpots[];
    } else {
      selfieSpots = await generator<SelfieSpots>({
        data: Array.from({ length: 5 }, () => createSelfieTemplate()),
        context: buildTripContext(trip),
        description:
          "selfie spot recommendations near the trip destination where tourists can take great selfie photos",
      });
    }

    let summary = "";
    let aiMessage: AIMessage;
    if (GENERATE_SUMMARIES) {
      const summaryResponse = await model.invoke([
        new SystemMessage(`You are a helpful selfie spot assistant.
Briefly summarize these selfie spot recommendations in 2-3 sentences.
Be concise and helpful.`),
        new HumanMessage(JSON.stringify(selfieSpots, null, 2)),
      ]);
      summary = summaryResponse.content as string;
      aiMessage = new AIMessage(summary);
    } else {
      aiMessage = new AIMessage("Here are your selfie spot recommendations.");
    }

    return {
      messages: [...state.messages, aiMessage],
      data: {
        type: "selfie",
        summary,
        options: selfieSpots,
      },
    };
  } catch (error) {
    const errorMessage = new AIMessage(
      "Something went wrong finding selfie spots. Please try again later.",
    );
    return { messages: [...state.messages, errorMessage] };
  }
}
