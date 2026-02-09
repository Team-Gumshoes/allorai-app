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

  return JSON.parse(toolMessage.content as string);
}
