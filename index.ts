import "dotenv/config";
import { graph } from "./graph/index.js";
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

  const result = await graph.invoke({ messages: conversation });

  spinner.stop();

  // Only print NEW messages (not already in conversation)
  const newMessages = result.messages.slice(conversation.length);
  // Only print AI messages (skip tool messages)
  newMessages
    .filter((m: BaseMessage) => m.type === "ai")
    .forEach((m: BaseMessage) => {
      console.log(colorize(m.content as string));
    });
  // Update conversation with all messages
  conversation = result.messages;

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
    const result = await graph.invoke({ messages: conversation });

    // Stop spinner before printing response
    spinner.stop();

    // Only print NEW messages (not already in conversation)
    const newMessages = result.messages.slice(conversationLengthBefore);
    // Only print AI messages (skip tool messages)
    newMessages
      .filter((m: BaseMessage) => m.type === "ai")
      .forEach((m: BaseMessage) => {
        console.log(colorize(m.content as string));
      });
    // Update conversation with all messages
    conversation = result.messages;

    promptUser();
  });
}
