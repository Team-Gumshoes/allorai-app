import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import type { Intent } from "../../types/intents.js";
// import { model } from "../../models/ollama.js";
// import { model } from "../../models/gemini.js";
import { model } from "../../models/openAi.js";

/**
 * Classify the user's request into exactly ONE of the following categories:
 * - arithmetic: simple math involving two numbers
 * - flights: getting flight data between two locations
 * - unsupported: anything else
 *
 * Takes the full conversation history to handle follow-up questions intelligently.
 */
export async function classifyIntent(messages: BaseMessage[]): Promise<Intent> {
  // Get the last few messages for context (up to 6 messages = 3 turns)
  const recentMessages = messages.slice(-6);

  const response = await model.invoke([
    new SystemMessage(`
    You are an intent classifier.

    Classify the user's LATEST request into exactly ONE of the following categories:
    - arithmetic: simple math involving two numbers (add, subtract, multiply, divide)
    - flights: getting flight data between two locations
    - unsupported: anything else

    CRITICAL: Consider the conversation history context.
    - If the assistant JUST asked a clarifying question in the previous message,
      the user is answering that question. Maintain the SAME intent as the original topic.
    - Even if the user's answer is unclear, gibberish, or doesn't make sense,
      if they're responding to a clarification question, keep the original intent.
    - Examples:
      User: "Find flights to LAX"
      Assistant: "What dates?"
      User: "January 8th to 16th"
      → "flights" (answering flight question)

      User: "Find flights to LAX"
      Assistant: "What's your departure airport?"
      User: "dfjkb"
      → "flights" (unclear answer, but still answering a flight question)

      User: "What's 5 + 3?"
      Assistant: "8"
      User: "Find flights"
      → "flights" (NEW request, not a follow-up)

    Rules:
    - Return JSON ONLY
    - No explanations
    - No markdown

    Example outputs:
    { "intent": "arithmetic" }
    { "intent": "flights" }
    { "intent": "unsupported" }
    `),
    ...recentMessages,
  ]);

  try {
    const parsed = JSON.parse(response.text);
    return parsed.intent as Intent;
  } catch {
    return "unsupported";
  }
}
