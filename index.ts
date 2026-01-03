import "dotenv/config";
import { runManager } from "./agents/managerAgent/index.js";
import type { BaseMessage } from "@langchain/core/messages";
import { HumanMessage } from "@langchain/core/messages";

/**  Formats and prints the trace, differentiating between human,
 * AI, and tool messages.
 * eg.
 * [human]: What is  30 - seven?
 * [ai]:
 * [tool]: 23
 */
// function printTrace(messages: BaseMessage[]) {
//   for (const msg of messages) {
//     if (msg.type === "human") {
//       console.log(`[human]: ${msg.text}`);
//     } else if (msg.type === "ai") {
//       console.log(`[ai]: ${msg.text}`);
//     } else if (msg.type === "tool") {
//       console.log(`[tool]: ${msg.text}`);
//     }
//   }
// }

// const userInput = process.argv.slice(2).join(" ");

// if (!userInput) {
//   console.error("Please provide a query.");
//   process.exit(1);
// }

// // Starting point
// // Runs the manager agent with the user's input.
// (async () => {
//   try {
//     const result = await runManager(userInput);

//     if (result.type === "error") {
//       console.log(`[system]: ${result.message}`);
//     } else if (result.type === "final") {
//       console.log(result.formatted);
//     } else {
//       printTrace(result.messages);
//     }
//   } catch (error) {
//     console.log(error);
//     process.exit(1);
//   }
// })();

/**
 * Above is the non-interactive mode. Accepts a single user input and prints the result.
 *
 * Below is the interactive mode. Accepts multiple user inputs and prints the result.
 */

import readline from "node:readline";
import { AIMessage } from "@langchain/core/messages";

// Interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let conversation: BaseMessage[] = [];

// Initial run
(async () => {
  const result = await runManager(conversation);

  if (result.type === "final") {
    result.message.forEach((m) => {
      console.log(m.content);
      conversation.push(m);
    });
  }

  promptUser();
})();

function promptUser() {
  rl.question("> ", async (input) => {
    if (input.toLowerCase() === "exit") {
      rl.close();
      return;
    }

    conversation.push(new HumanMessage(input));

    const result = await runManager(conversation);

    if (result.type === "final") {
      result.message.forEach((m) => {
        console.log(m.content);
        conversation.push(m);
      });
    }

    promptUser();
  });
}
