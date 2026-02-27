import { generator } from "../../../utils/agents/generator.js";
import type { Tips } from "../../../types/tips/tips.js";
import type { Trip } from "../../../types/trip.js";
import { nanoid } from "nanoid";
import {
  searchWikipediaPageId,
  fetchWikipediaSections,
  fetchWikipediaSectionContent,
  fetchWikipediaFullExtract,
} from "../../../tools/travel/searchWikipedia.js";
import type { GroupedContent } from "../../../tools/travel/searchWikipedia.js";
import { classifySections } from "./utils/classifySections.js";
import { analyzeTips } from "./utils/analyzeTips.js";

function buildTripContext(trip: Trip): Record<string, unknown> {
  return {
    destination: trip.destination,
    city: trip.city,
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

async function generateTipsWithGenerator(trip: Trip): Promise<Tips[]> {
  return generator<Tips>({
    data: [createTipsTemplate()],
    context: buildTripContext(trip),
    description:
      "travel tips for the trip destination. Each tip should be 2-4 sentences. transportTips: useful transportation tips that visitors can use during their trip at the destination. whenToVisitTips: information on good times to visit and when to avoid crowds, mentioning any holidays, festivals, or events that might be happening soon. safetyTips: information to help the user avoid low traffic or dangerous areas and helpful tips to keep them safe during their trip.",
  });
}

export async function generateTips(trip: Trip): Promise<Tips[]> {
  if (!trip.city) {
    return generateTipsWithGenerator(trip);
  }

  try {
    // Step 1: Find the Wikipedia page
    const pageId = await searchWikipediaPageId(trip.city);
    if (pageId === null) {
      console.warn(
        "[tipsNode] No Wikipedia article found for city, using generator fallback",
      );
      return generateTipsWithGenerator(trip);
    }

    // Step 2: Get TOC sections
    const sections = await fetchWikipediaSections(pageId);
    if (sections.length === 0) {
      console.warn(
        "[tipsNode] No Wikipedia sections found, using generator fallback",
      );
      return generateTipsWithGenerator(trip);
    }

    // Step 3: LLM classifies which sections are relevant
    const classified = await classifySections(sections, trip.city);

    // Step 4: Fetch all relevant section content in parallel (HTML already stripped)
    const sectionContents = await Promise.all(
      classified.map(async (section) => {
        const content = await fetchWikipediaSectionContent(
          pageId,
          section.index,
        );
        return { ...section, content };
      }),
    );

    // Step 5: Group non-empty content by category
    const grouped: GroupedContent = {
      transportation: [],
      safety: [],
      whenToVisit: [],
    };
    for (const entry of sectionContents) {
      if (entry.content.trim().length > 0) {
        grouped[entry.category].push(entry.content);
      }
    }

    // Step 6: Lazy fallback — fetch full plain-text extract only if any bucket is empty
    const needsFullExtract =
      grouped.transportation.length === 0 ||
      grouped.safety.length === 0 ||
      grouped.whenToVisit.length === 0;

    if (needsFullExtract) {
      const fullText = await fetchWikipediaFullExtract(pageId);
      if (fullText !== null) {
        if (grouped.transportation.length === 0)
          grouped.transportation = [fullText];
        if (grouped.safety.length === 0) grouped.safety = [fullText];
        if (grouped.whenToVisit.length === 0) grouped.whenToVisit = [fullText];
      }
    }

    // Step 7: Single LLM call to generate all three tips from the grouped content
    const tips = await analyzeTips(grouped, trip);
    return [tips];
  } catch (error) {
    console.error(
      "[tipsNode] Wikipedia pipeline error, falling back to generator:",
      error,
    );
    return generateTipsWithGenerator(trip);
  }
}
