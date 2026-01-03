import type { BaseMessage } from "@langchain/core/messages";

/**
 * Returns true if the given messages contain at least one tool message.
 * @param {BaseMessage[]} messages - The messages to check.
 * @returns {boolean} - True if the messages contain a tool message, false otherwise.
 */
export function hasToolOutput(messages: BaseMessage[]) {
  return messages.some((m) => m.type === "tool");
}
