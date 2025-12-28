# Simple AI Agent with Subagents

This is a simple AI Agent built for learning purposes. The initial agent is a teacher agent which utilizies mathematic tools to solve simple arithmetic questions. The goal is to include a manager agent along with additional sub agents to allow the manager to reason and plan which agents to use to solve user prompts.

Originally created as a single `index.ts` file (is `index.old.ts` for reference). Will be adjusted to be scalable to easily add multiple agents.

## Description

There is a single manager agent that determines which agent to use to answer the user's prompt. This is decided by a `classifyIntent()` function, but will eventually be replaced by the manager reasoning on its own to determine the best course of action. This is to be able to call multiple agents, aggregate results, and do the final output.

## Branches

- `main`: Contains the original single file `index.ts` file.
- `scalable-multi-file-and-multi-agent-workflow`: Contains the same implementation in main, but in a scalable architecture with 2 agents.

## Agents

- Manager agent
  - Orchestrator/planner.
  - Decides which agent to use.
  - Aggregates and formats the results to output.
- Teacher agent
  - Answers simple arithmetic questions (+,-,\*,/) involving operations between 2 numbers. Will use tools when possible, and refuse to answer if not.

## Installation

**This project uses pnpm.**

Install packages with the following command.

```bash
  pnpm i
```

You must also have an API key from an AI service you are using, or install a local model with Ollama. If using an AI service, place the API key in the `.env` file as shown in the `.env.example` file. If using a local Ollama model, change the model string in `models/ollama.ts`.

## Usage/Examples

To run this project run the following with your prompt. Quotation marks are mandatory to pass prompt as a single string.

```bash
  pnpm run prompt "What is 4 + 6?"
```

## AI Models

If you use a different AI service, make sure to install the appropriate package for it through LangChain. Already installed...

- @langchain/google-genai
- @langchain/ollama

## Learning Resources

Langchain Quickstart Guide:

https://docs.langchain.com/oss/javascript/langgraph/quickstart

## Screenshots

### Single file, single agent

<img width="271" height="70" alt="image" src="https://github.com/user-attachments/assets/7d9bd216-2d4e-457b-876f-9080e30289cc" />

### Multi file, multi agent

<img width="229" height="54" alt="image" src="https://github.com/user-attachments/assets/d5208155-d681-4ccf-b2df-c5a8fc1e1548" />

<img width="274" height="56" alt="image" src="https://github.com/user-attachments/assets/fea43131-6000-4687-94ee-59ef3604459c" />


