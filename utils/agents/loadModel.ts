import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export type ModelTier = "fast" | "standard" | "smart";

/**
 * Dynamically loads an LLM based on environment variables for the given tier.
 *
 * Required env vars per tier (e.g. for "smart"):
 *   SMART_MODEL_COMPANY=OpenAI | GoogleGemini | Ollama
 *   SMART_MODEL_NAME=<model-name>
 *
 * Tier assignments:
 *   fast     → classifyIntent (routing / classification)
 *   standard → arithmeticNode, summarizeFlights (moderate reasoning)
 *   smart    → all travel-planning nodes + generator (full generation)
 */
export function loadModel(tier: ModelTier): BaseChatModel {
  const prefix = tier.toUpperCase();
  const company = process.env[`${prefix}_MODEL_COMPANY`];
  const modelName = process.env[`${prefix}_MODEL_NAME`];

  if (!company || !modelName) {
    throw new Error(
      `Missing env vars: ${prefix}_MODEL_COMPANY and ${prefix}_MODEL_NAME must both be set.`,
    );
  }

  switch (company) {
    case "OpenAI":
      return new ChatOpenAI({
        model: modelName,
        temperature: 1, // temperature: 1 is required for gpt-5-nano and valid for all OpenAI models
        maxRetries: 2,
      });
    case "GoogleGemini":
      return new ChatGoogleGenerativeAI({
        model: modelName,
        temperature: 0,
      });
    case "Ollama":
      return new ChatOllama({
        model: modelName,
        temperature: 0,
      });
    default:
      throw new Error(
        `Unknown MODEL_COMPANY "${company}". Valid values: OpenAI, GoogleGemini, Ollama`,
      );
  }
}
