import { tool } from "@langchain/core/tools";
import * as z from "zod";

// Tool to divide two numbers
export const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "Divide two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});
