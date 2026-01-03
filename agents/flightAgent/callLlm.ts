import { SystemMessage } from "@langchain/core/messages";
import { flightModel } from "./model.js";
import type { BaseMessage } from "@langchain/core/messages";

export async function callLlm(messages: BaseMessage[]) {
  return flightModel.invoke([
    new SystemMessage(`
    You are a flight research agent.

    You have access to flight related tools.

    Rules:
    - You MUST use tools to answer flight-related questions.
    - You MUST NOT invent flight data.
    - If required details are missing, you may ask ONLY A SINGLE clarifying question if you cannot call ANY available tool.
    - Ask ONE clarification question at a time.
    - Do not ask about preferences unelss required by a tool.
    - Do NOT formate results for the user.
    `),
    ...messages,
  ]);
}
