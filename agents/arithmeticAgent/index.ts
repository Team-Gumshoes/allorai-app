import { addMessages } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { callLlm } from "./callLlm.js";
import { callTool } from "./callTool.js";

/**
 * Runs the arithmetic agent with the given input.
 * The agent will loop until there are no more tool calls
 * from the model. The results of the tool calls and the
 * model's responses are aggregated and returned.
 * @param {BaseMessage[]} input - The user's input.
 * @returns {Promise<BaseMessage[]>} - The aggregated results of the tool calls and the model's responses.
 */
export async function runArithmeticAgent(
  input: BaseMessage[]
): Promise<BaseMessage[]> {
  let messages = [...input];
  let modelResponse = await callLlm(messages);

  while (true) {
    // Add the model's response to messages
    messages = addMessages(messages, [modelResponse]);

    // If no tools were called, we're done
    if (!modelResponse.tool_calls?.length) break;

    // Execute all tool calls
    const toolResults = await Promise.all(
      modelResponse.tool_calls.map(callTool)
    );

    // Add tool results and get next response
    messages = addMessages(messages, toolResults);
    modelResponse = await callLlm(messages);
  }

  return messages;
}
