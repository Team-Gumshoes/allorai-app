import { SystemMessage } from "@langchain/core/messages";
import { arithmeticModel } from "./model.js";
import type { BaseMessage } from "@langchain/core/messages";

/**
 * Calls the arithmetic model with the given messages.
 * The arithmetic model is given instructions to follow
 * specific rules for answering arithmetic questions.
 * @param {BaseMessage[]} messages - The messages to be passed to the model.
 * @returns {Promise<BaseMessage[]>} - The response from the model.
 */
export async function callLlm(messages: BaseMessage[]) {
  return arithmeticModel.invoke([
    new SystemMessage(`
    You are a helpful arithmetic assistant.

    You can help with basic arithmetic between TWO numbers:
    - Addition
    - Subtraction
    - Multiplication
    - Division

    Rules:
    - You MUST use the provided tools for all calculations.
    - You MUST NOT calculate results yourself.
    - Be CONCISE. Keep responses short (1-2 sentences max).
    - If missing info, ask for ONLY what's needed. Example: "What's the second number?"
    - If the user asks for unsupported operations (derivatives, square roots, exponents,
      variables, 3+ numbers), briefly say you can only do basic arithmetic with 2 numbers.
    - Review conversation history before asking - they may have already provided some info.
    `),
    ...messages,
  ]);
}
