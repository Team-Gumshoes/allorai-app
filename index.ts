import "dotenv/config";
import { runManager } from "./agents/managerAgent/index.js";
import type { BaseMessage } from "@langchain/core/messages";
import { HumanMessage } from "@langchain/core/messages";
import { colorize } from "./utils/colors.js";
import { Spinner } from "./utils/spinner.js";

/**
 * Above is the non-interactive mode. Accepts a single user input and prints the result.
 *
 * Below is the interactive mode. Accepts multiple user inputs and prints the result.
 */

import readline from "node:readline";

// Interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let conversation: BaseMessage[] = [];

// Initial run
(async () => {
  const spinner = new Spinner("Starting");
  spinner.start();

  const result = await runManager(conversation);

  spinner.stop();

  if (result.type === "final") {
    // Only print NEW messages (not already in conversation)
    const newMessages = result.message.slice(conversation.length);
    // Only print AI messages (skip tool messages)
    newMessages
      .filter((m) => m.type === "ai")
      .forEach((m) => {
        console.log(colorize(m.content as string));
      });
    // Add all messages to conversation
    conversation.push(...result.message);
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

    // Show spinner while agent is thinking
    const spinner = new Spinner("Thinking");
    spinner.start();

    const conversationLengthBefore = conversation.length;
    const result = await runManager(conversation);

    // Stop spinner before printing response
    spinner.stop();

    if (result.type === "final") {
      // Only print NEW messages (not already in conversation)
      const newMessages = result.message.slice(conversationLengthBefore);
      // Only print AI messages (skip tool messages)
      newMessages
        .filter((m) => m.type === "ai")
        .forEach((m) => {
          console.log(colorize(m.content as string));
        });
      // Add all messages to conversation
      conversation.push(...result.message);
    }

    promptUser();
  });
}
