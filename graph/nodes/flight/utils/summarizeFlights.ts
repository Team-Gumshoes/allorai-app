import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import type { FlightResults } from "../../../../types/flight/flights.js";
import { loadModel } from "../../../../utils/agents/loadModel.js";

const model = loadModel("standard");

export async function summarizeFlights(
  flights: FlightResults[],
  input: BaseMessage[],
): Promise<string> {
  // Get all user messages
  const userMessages = input
    .filter((m) => m.type === "human")
    .map((m) => m.content)
    .join("\n");

  const response = await model.invoke([
    new SystemMessage(`
      You are a travel assistant.

      Your job is to summarize flight options for a user.

      Rules:
      - Do NOT invent data
      - Only use the provided flight JSON
      - Be concise and helpful
      - Compare price, duration, and stops
      - Recommend an option if clearly better
    `),
    new HumanMessage(`
      User request:
      ${userMessages}

      Flight options (JSON):
      ${JSON.stringify(flights, null, 2)}
    `),
  ]);

  return response.content as string;

  // const prompt = `
  //   User request:
  //   ${userMessages}

  //   Flight options (JSON):
  //   ${JSON.stringify(flights, null, 2)}

  //   Task:
  //   - Summarize the available flight options
  //   - Highlight differences (price, duration, stops)
  //   - Recommend the best option if appropriate
  //   - Keep the response concise and helpful
  // `;

  // const response = await callLlm([new HumanMessage(prompt)]);
  // return response.content as string;
}
