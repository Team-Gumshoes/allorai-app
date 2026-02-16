import { generator } from "../../../utils/agents/generator.js";
import type { Tips } from "../../../types/tips/tips.js";
import type { Trip } from "../../../types/trip.js";
import { nanoid } from "nanoid";

function buildTripContext(trip: Trip): Record<string, unknown> {
  return {
    destination: trip.destination,
    origin: trip.origin,
    budget: trip.budget,
    hotel: trip.hotel,
    interests: trip.interests,
    constraints: trip.constraints,
    departureDate: trip.departureDate,
    returnDate: trip.returnDate,
  };
}

function createTipsTemplate(): Tips {
  return {
    id: nanoid(),
    transportTips: null as unknown as string,
    whenToVisitTips: null as unknown as string,
    safetyTips: null as unknown as string,
  };
}

export async function generateTips(trip: Trip): Promise<Tips[]> {
  const tips = await generator<Tips>({
    data: [createTipsTemplate()],
    context: buildTripContext(trip),
    description:
      "travel tips for the trip destination. Each tip should be 2-4 sentences. transportTips: useful transportation tips that visitors can use during their trip at the destination. whenToVisitTips: information on good times to visit and when to avoid crowds, mentioning any holidays, festivals, or events that might be happening soon. safetyTips: information to help the user avoid low traffic or dangerous areas and helpful tips to keep them safe during their trip.",
  });

  return tips;
}
