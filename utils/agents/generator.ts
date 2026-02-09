import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { model } from "../../models/openAi.js";

interface GeneratorOptions<T> {
  /** Data template(s) with null values to be filled. Can be a single object or array. */
  data: T | T[];
  /** Contextual information the LLM uses to generate appropriate values. */
  context: Record<string, unknown>;
  /** A description of what kind of data is being generated. */
  description: string;
}

/**
 * Generic utility that calls an LLM to fill null values in JSON data
 * with contextually appropriate values.
 *
 * Scans the input for null fields, sends the data + context to the LLM,
 * and returns the same structure with nulls replaced.
 * Non-null values are preserved defensively after generation.
 *
 * @returns Always returns an array of T, even if a single object was provided.
 */
export async function generator<T extends object>(
  options: GeneratorOptions<T>,
): Promise<T[]> {
  const dataArray = Array.isArray(options.data) ? options.data : [options.data];

  // Identify which fields are null so the LLM knows what to fill
  const first = (dataArray[0] ?? {}) as Record<string, unknown>;
  const nullFields = Object.entries(first)
    .filter(([, v]) => v === null)
    .map(([k]) => k);

  const response = await model.invoke([
    new SystemMessage(`You are a data generator assistant.

You will receive:
1. A JSON data template with some null values
2. Context information to guide your generation

Your task:
- Fill ONLY the null values with contextually appropriate data
- NEVER modify fields that already have non-null values
- Use the provided context to make generated values relevant and realistic
- Return valid JSON only, no markdown, no explanations
- Always return a JSON array, even for a single item
- Match the exact structure and field names of the input template`),
    new HumanMessage(`Description: ${options.description}

Context:
${JSON.stringify(options.context, null, 2)}

Data template (fields to fill: ${nullFields.join(", ")}):
${JSON.stringify(dataArray, null, 2)}

Return ONLY a JSON array with null values filled in.`),
  ]);

  const text = (response.content as string).trim();
  let parsed: T[];

  try {
    parsed = JSON.parse(text);
  } catch {
    // Try stripping markdown code fences
    const stripped = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "");
    parsed = JSON.parse(stripped);
  }

  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  // Defensive: preserve any non-null values from the original template
  return parsed.map((item, index) => {
    const original = (dataArray[index] ?? dataArray[0]!) as Record<string, unknown>;
    const result = { ...item } as Record<string, unknown>;
    for (const key of Object.keys(original)) {
      if (original[key] !== null && original[key] !== undefined) {
        result[key] = original[key];
      }
    }
    return result as T;
  });
}
