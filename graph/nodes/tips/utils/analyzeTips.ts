import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import type { Tips } from "../../../../types/tips/tips.js";
import type { Trip } from "../../../../types/trip.js";
import type { GroupedContent } from "../../../../tools/travel/searchWikipedia.js";
import { loadModel } from "../../../../utils/agents/loadModel.js";
import { nanoid } from "nanoid";

const model = loadModel("fast");

/**
 * Uses an LLM to analyze grouped Wikipedia content and generate all three
 * tip categories in a single call. Throws on parse failure so the orchestrator
 * can catch it and fall back to the generator.
 */
export async function analyzeTips(
  grouped: GroupedContent,
  trip: Trip,
): Promise<Tips> {
  const transportContent =
    grouped.transportation.length > 0
      ? grouped.transportation.join("\n\n")
      : "(No specific Wikipedia content found — write general transport advice for this destination)";

  const safetyContent =
    grouped.safety.length > 0
      ? grouped.safety.join("\n\n")
      : "(No specific Wikipedia content found — write general safety advice for this destination)";

  const whenToVisitContent =
    grouped.whenToVisit.length > 0
      ? grouped.whenToVisit.join("\n\n")
      : "(No specific Wikipedia content found — write general seasonal advice for this destination)";

  const response = await model.invoke([
    new SystemMessage(`
      You are a travel tips writer. Your job is to produce concise, accurate travel tips
      grounded in the provided Wikipedia source material.

      Rules:
      - Each tip MUST be 2-4 sentences, prose only (no bullet points)
      - Base your writing on the provided source material — do not invent specific facts
      - Write in a friendly, direct tone suitable for a traveler
      - Return JSON ONLY — no markdown, no explanation

      Output format:
      {
        "transportTips": "...",
        "safetyTips": "...",
        "whenToVisitTips": "..."
      }
    `),
    new HumanMessage(`
      Destination: ${trip.city}
      Travel dates: ${trip.departureDate ?? "unspecified"} to ${trip.returnDate ?? "unspecified"}

      TRANSPORTATION SOURCE MATERIAL:
      ${transportContent}

      SAFETY SOURCE MATERIAL:
      ${safetyContent}

      WHEN TO VISIT SOURCE MATERIAL:
      ${whenToVisitContent}

      Generate three travel tips grounded in the source material above.
      Return ONLY a JSON object with keys: transportTips, safetyTips, whenToVisitTips.
    `),
  ]);

  const text = (response.content as string).trim();
  let parsed: {
    transportTips: string;
    safetyTips: string;
    whenToVisitTips: string;
  };

  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    const stripped = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "");
    parsed = JSON.parse(stripped) as typeof parsed;
  }

  return {
    id: nanoid(),
    transportTips: parsed.transportTips,
    safetyTips: parsed.safetyTips,
    whenToVisitTips: parsed.whenToVisitTips,
  };
}
