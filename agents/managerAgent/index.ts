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
          "Hi! I can help you find flights.\n Please ask an arithmetic or travel-related question."
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
      message: [new AIMessage("No user input provided")],
    };
  }

  // Determine the user's intent
  const intent = await classifyIntent(lastHumanMessage.content as string);

  if (intent === "arithmetic") {
    const agentResults = await runArithmeticAgent(messages);

    return { type: "final", message: agentResults };
  }

  if (intent === "flights") {
    const agentResults = await runFlightAgent(messages);

    if ("needsClarification" in agentResults) {
      return {
        type: "final",
        message: [new AIMessage(agentResults.needsClarification)],
      };
    }

    // const { flightData, formattedFlights, summary } = await runFlightAgent(
    //   input
    // );
    const { flightData, summary, formattedFlights } = agentResults;

    return {
      type: "final",
      message: [new AIMessage(`${summary}\n\n${formattedFlights}`)],
    };
  }

  return {
    type: "final",
    message: [
      new AIMessage("Please ask an arithmetic or travel-related question."),
    ],
  };
}
