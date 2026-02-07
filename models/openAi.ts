import { ChatOpenAI } from "@langchain/openai";

// Creates a model using OpenAI
export const model = new ChatOpenAI({
  model: "gpt-5-nano",
  // temperature: 0,
  temperature: 1, // gpt-5-nano only supports a default temperature of 1
  maxRetries: 2,
});
