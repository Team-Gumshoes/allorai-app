import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Create the model using Google Gemini
export const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  // model: "gemini-2.0-flash",
  temperature: 0, // Controls randomness. 0 is good for deterministic results (Math, tools, agents).
});
