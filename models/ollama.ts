import { ChatOllama } from "@langchain/ollama";

// Creates a model using Ollama
export const model = new ChatOllama({
  model: "qwen2.5:3b",
  // model: "qwen3:4b", // Unused
  temperature: 0, // Controls randomness. 0 is good for deterministic results (Math, tools, agents).
});
