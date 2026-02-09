import { tool } from "@langchain/core/tools";
import * as z from "zod";

// Tool to multiply two numbers
export const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});
