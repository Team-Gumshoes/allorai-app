import { tool } from "@langchain/core/tools";
import * as z from "zod";

// Tool to add two numbers
export const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: `
    Adds two numbers together.
    Use this ONLY when the user asks for addition
    between exactly two numeric values.
    Do NOT use for subtraction, multiplication, or word problems.
    `,
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});
