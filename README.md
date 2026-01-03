# Simple AI Agent with Subagents

This is a simple AI Agent built for learning purposes. The initial agent is a teacher agent which utilizies mathematic tools to solve simple arithmetic questions. The goal is to include a manager agent along with additional sub agents to allow the manager to reason and plan which agents to use to solve user prompts.

Originally created as a single `index.ts` file (is `index.old.ts` for reference). Will be adjusted to be scalable to easily add multiple agents.

## Description

### continuous-multi-agent-travel-math-agents

The manager agent uses `classifyIntent()` to classify the user's prompt into an intent (arithmetic, travel, unsupported). After knowing the intent, the manager agent can then call the appropriate agent to answer the user's prompt and return data.
The travel agent uses the Amadeus API to fetch travel information. The flight data is manually formatted with a function and the data is summarized by the agent to let the user know the best choices.

## Branches

- `main`: Contains the original single file `index.ts` file.
- `scalable-multi-file-and-multi-agent-workflow`: Contains the same implementation in main, but in a scalable architecture with 2 agents.
- `continuous-multi-agent-travel-math-agents`: Adds a third travel agent which uses a third party API (Amadeus) to fetch flight information for a single traveler as long as the user provides origin/destination aiports and arrival/departure dates.

## Agents

- Manager Agent
  - Orchestrator/planner.
  - Decides which agent to use by classifying the user's intent (arithmetic, travel, unsupported)
  - Aggregates and formats the results to output.
- Teacher Agent
  - Answers simple arithmetic questions (+,-,\*,/) involving operations between 2 numbers. Will use tools when possible, and refuse to answer if not.
- Travel Agent
  - Gets user flight information for a single passenger if provided an origin airport, destination airport, departure date, and arrival date.

## Installation

**This project uses pnpm.**

Install packages with the following command.

```bash
  pnpm i
```

You must also have an API key from an AI service you are using, or install a local model with Ollama. If using an AI service, place the API key in the `.env` file as shown in the `.env.example` file. If using a local Ollama model, change the model string in `models/ollama.ts`.

## Usage/Examples

To run this project run the following to start the conversation. You can then continuously ask the agent questions.

```bash
  pnpm run prompt
```

## AI Models

If you use a different AI service, make sure to install the appropriate package for it through LangChain. Already installed...

- @langchain/google-genai
- @langchain/ollama
- @langchain/openai

## Learning Resources

Langchain Quickstart Guide:

https://docs.langchain.com/oss/javascript/langgraph/quickstart

## Screenshots

### Single file, single agent

<img width="271" height="70" alt="image" src="https://github.com/user-attachments/assets/7d9bd216-2d4e-457b-876f-9080e30289cc" />

### Multi file, multi agent

<img width="229" height="54" alt="image" src="https://github.com/user-attachments/assets/d5208155-d681-4ccf-b2df-c5a8fc1e1548" />

<img width="274" height="56" alt="image" src="https://github.com/user-attachments/assets/fea43131-6000-4687-94ee-59ef3604459c" />
