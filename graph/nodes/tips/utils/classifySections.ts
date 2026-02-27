import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import type {
  WikipediaSection,
  ClassifiedSection,
} from "../../../../tools/travel/searchWikipedia.js";
import { loadModel } from "../../../../utils/agents/loadModel.js";

const model = loadModel("fast");

/**
 * Uses an LLM to identify which Wikipedia sections are relevant to the three
 * tip categories: transportation, safety, and whenToVisit.
 * Returns an empty array if classification fails or no sections match.
 */
export async function classifySections(
  sections: WikipediaSection[],
  city: string,
): Promise<ClassifiedSection[]> {
  const response = await model.invoke([
    new SystemMessage(`
      You are a Wikipedia section classifier for travel content.

      Your job: given a list of Wikipedia article sections for a travel destination,
      identify which sections are relevant to exactly three categories:
      - transportation: sections about getting around, transit, public transport, taxis, airports, bus, metro, train
      - safety: sections about crime, safety precautions, police, emergency services, health warnings, scams
      - whenToVisit: sections about climate, weather, seasons, best time to visit, festivals, holidays, events, crowds

      Rules:
      - Only include sections that clearly match one of the three categories
      - A section may only be assigned ONE category (pick the most relevant)
      - Exclude all other sections (history, culture, cuisine, architecture, etc.)
      - Return JSON ONLY — no markdown, no explanation
      - If no sections match a category, simply omit it from results
      - If no sections match any category, return an empty array: []

      Output format (JSON array):
      [
        { "index": "3", "line": "Transport", "category": "transportation" },
        { "index": "7", "line": "Climate", "category": "whenToVisit" }
      ]
    `),
    new HumanMessage(`
      City: ${city}

      Wikipedia sections:
      ${JSON.stringify(sections, null, 2)}

      Return only a JSON array of classified sections.
    `),
  ]);

  const text = response.text.trim();

  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as ClassifiedSection[];
  } catch {
    try {
      const stripped = text
        .replace(/^```(?:json)?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "");
      const parsed = JSON.parse(stripped) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed as ClassifiedSection[];
    } catch {
      return [];
    }
  }
}
