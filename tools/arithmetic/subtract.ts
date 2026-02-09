import { tool } from "@langchain/core/tools";
import * as z from "zod";

// Tool to subtract two numbers
export const subtract = tool(({ a, b }) => a - b, {
  name: "subtract",
  description: "Subtract two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});
