import { classifyIntent } from "./classifyIntent.js";
import { runArithmeticAgent } from "../arithmeticAgent/index.js";
import { runFlightAgent } from "../flightAgent/index.js";
// import { formatFinalOutput } from "../../utils/formatFinalOutput.js";
import type { BaseMessage } from "@langchain/core/messages";
import { AIMessage } from "@langchain/core/messages";

type ManagerResult =
  | { type: "trace"; messages: BaseMessage[] }
  | { type: "final"; message: BaseMessage[] }
  | { type: "error"; message: BaseMessage[] };

// Controller agent - Decides which agent to use after classifying the intent
// of the user's request
export async function runManager(
  messages: BaseMessage[]
): Promise<ManagerResult> {
  if (messages.length === 0) {
    return {
      type: "final",
      message: [
        new AIMessage(
          "Hi! I can help you find flights.\nPlease ask an arithmetic or travel-related question."
        ),
      ],
    };
  }

  const lastHumanMessage = [...messages]
    .reverse()
    .find((m) => m.type === "human");

  if (!lastHumanMessage) {
    return {
      type: "error",
      message: [...messages, new AIMessage("No user input provided")],
    };
  }

  // Determine the user's intent (now context-aware)
  const intent = await classifyIntent(messages);

  if (intent === "arithmetic") {
    const agentResults = await runArithmeticAgent(messages);

    return { type: "final", message: agentResults };
  }

  if (intent === "flights") {
    const agentResults = await runFlightAgent(messages);

    if ("needsClarification" in agentResults) {
      return {
        type: "final",
        message: agentResults.messages,
      };
    }

    const { flightData, summary, formattedFlights, messages: agentMessages } = agentResults;

    // Add the summary as the final AI message
    const finalMessage = new AIMessage(`${summary}\n\n${formattedFlights}`);

    return {
      type: "final",
      message: [...agentMessages, finalMessage],
    };
  }

  // Unsupported intent - return conversation with new message
  return {
    type: "final",
    message: [
      ...messages,
      new AIMessage("Please ask an arithmetic or travel-related question."),
    ],
  };
}
