import type { BaseMessage } from "@langchain/core/messages";

/**
 * Scans message history to find most recent tool message.
 * Assumes the tool returned JSON as a string.
 * Parses and returns the JSON.
 *
 * @param messages
 * @returns
 */
export function extractLastToolJson<T>(messages: BaseMessage[]): T {
  const toolMessage = [...messages].reverse().find((m) => m.type === "tool");

  if (!toolMessage) {
    throw new Error("No tool output found");
  }

  const raw = toolMessage.content;

  // content can be a string or an array of content blocks
  // (e.g., [{type: "text", text: "..."}])
  let text: string;
  if (typeof raw === "string") {
    text = raw;
  } else if (Array.isArray(raw)) {
    const textBlock = raw.find(
      (block): block is { type: string; text: string } =>
        typeof block === "object" &&
        block !== null &&
        "text" in block &&
        typeof (block as Record<string, unknown>).text === "string",
    );
    if (!textBlock) {
      throw new Error(
        `Tool message content is an array but contains no text block. Content: ${JSON.stringify(raw).slice(0, 200)}`,
      );
    }
    text = textBlock.text;
  } else {
    throw new Error(`Unexpected tool message content type: ${typeof raw}`);
  }

  return JSON.parse(text);
}
