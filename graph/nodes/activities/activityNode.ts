import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { loadModel } from "../../../utils/agents/loadModel.js";
import { generator } from "../../../utils/agents/generator.js";
import type { Activities } from "../../../types/activities/activities.js";
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

function createActivitiesTemplate(): Activities {
  return {
    id: nanoid(),
    name: null as unknown as string,
    location: null as unknown as string,
    description: null as unknown as string,
    website: null as unknown as string,
    imageUrl: "",
  };
}

export async function activityNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const trip = state.trip;
  const missingFields = getMissingFields(trip);

  // If destination is missing, ask for it
  if (missingFields.length > 0) {
    const response = await model.invoke([
      new SystemMessage(`You are a helpful activities assistant.
You need the user's trip destination to recommend activities.
Ask for the missing information concisely (1-2 sentences max).
Missing: ${missingFields.join(", ")}`),
      ...state.messages.slice(-6),
    ]);

    const aiMessage = new AIMessage(response.content as string);
    return { messages: [...state.messages, aiMessage] };
  }

  try {
    let activities: Activities[];

    if (USE_PLACES_API && trip.hotelCoords) {
      activities = (await searchNearbyPlaces({
        type: "activities",
        latitude: trip.hotelCoords.latitude,
        longitude: trip.hotelCoords.longitude,
      })) as Activities[];
    } else {
      activities = await generator<Activities>({
        data: Array.from({ length: 10 }, () => createActivitiesTemplate()),
        context: buildTripContext(trip),
        description: "activity recommendations near the trip destination",
      });
    }

    let summary = "";
    let aiMessage: AIMessage;
    if (GENERATE_SUMMARIES) {
      const summaryResponse = await model.invoke([
        new SystemMessage(`You are a helpful activities assistant.
Briefly summarize these activity recommendations in 2-3 sentences.
Be concise and helpful.`),
        new HumanMessage(JSON.stringify(activities, null, 2)),
      ]);
      summary = summaryResponse.content as string;
      aiMessage = new AIMessage(summary);
    } else {
      aiMessage = new AIMessage("Here are your activity recommendations.");
    }

    return {
      messages: [...state.messages, aiMessage],
      data: {
        type: "activities",
        summary,
        options: activities,
      },
    };
  } catch (error) {
    const errorMessage = new AIMessage(
      "Something went wrong finding activities. Please try again later.",
    );
    return { messages: [...state.messages, errorMessage] };
  }
}
