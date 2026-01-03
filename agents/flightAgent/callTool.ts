import type { ToolCall } from "@langchain/core/messages/tool";
import { flightToolsByName, type FlightToolName } from "./tools.js";

export async function callTool(toolCall: ToolCall) {
  const name = toolCall.name as FlightToolName;
  const tool = flightToolsByName[name]; // Used by the code

  if (!tool) {
    throw new Error(`Unknown tool: ${toolCall.name}`);
  }

  return tool.invoke(toolCall);
}
