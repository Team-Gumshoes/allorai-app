import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import type { Intent } from "../../../../types/intents.js";
// import { model } from "../../models/ollama.js";
// import { model } from "../../models/gemini.js";
import { model } from "../../../../models/openAi.js";

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
    - hotel: finding hotels, lodging, or accommodation at a destination
    - restaurant: finding restaurants, food, or dining recommendations at a destination
    - selfie: finding good selfie spots, photo locations, or instagram-worthy places at a destination
    - activities: finding activities, things to do, experiences, tours, or entertainment at a destination
    - nature: finding nature-related activities like hiking, national parks, wildlife, scenic trails, or outdoor nature experiences at a destination
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

      User: "Find hotels in Paris"
      Assistant: "What's your budget?"
      User: "Around $200/night"
      → "hotel" (answering hotel question)

      User: "Find restaurants in Tokyo"
      Assistant: "What kind of cuisine are you interested in?"
      User: "Italian"
      → "restaurant" (answering restaurant question)

      User: "Where can I take selfies in Paris?"
      Assistant: "Any particular vibe you're going for?"
      User: "Iconic landmarks"
      → "selfie" (answering selfie question)

      User: "What can I do in Rome?"
      Assistant: "Any particular interests?"
      User: "Historical sites"
      → "activities" (answering activities question)

      User: "I want to go hiking in Colorado"
      Assistant: "Any preferences on difficulty level?"
      User: "Moderate trails"
      → "nature" (answering nature question)

    Rules:
    - Return JSON ONLY
    - No explanations
    - No markdown

    Example outputs:
    { "intent": "arithmetic" }
    { "intent": "flights" }
    { "intent": "hotel" }
    { "intent": "restaurant" }
    { "intent": "selfie" }
    { "intent": "activities" }
    { "intent": "nature" }
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
