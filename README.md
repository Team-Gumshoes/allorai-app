# Trip Planning Multi-Agent Server

An Express server that uses LangChain's LangGraph to build AI agents with a supervisor pattern. A supervisor agent analyzes user intent and routes requests to specialized agents that can answer questions using their own tools.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Usage](#api-usage)
  - [POST /chat](#post-chat)
  - [GET /health](#get-health)
- [Agents](#agents)
  - [Arithmetic Agent](#arithmetic-agent)
  - [Flight Agent](#flight-agent)
  - [Restaurant Agent](#restaurant-agent)
- [Generator Function](#generator-function)
  - [Overview](#overview)
  - [Usage](#usage)
  - [Parameters](#parameters)
  - [How It Works](#how-it-works)
  - [Examples](#examples)
- [Supported Models](#supported-models)
- [Extensibility Guide](#extensibility-guide)
  - [Adding a New Agent with Tools](#adding-a-new-agent-with-tools)
  - [Adding a New Agent without Tools](#adding-a-new-agent-without-tools)
- [Project Structure](#project-structure)
- [Learning Resources](#learning-resources)

## Features

- **Multi-Agent Architecture**: Supervisor pattern with intent-based routing
- **Arithmetic Agent**: Basic math operations (+, -, \*, /) between two numbers
- **Flight Agent**: Search for round-trip flights using the Amadeus API
- **Restaurant Agent**: LLM-generated restaurant recommendations using the generator function
- **Generator Function**: Generic utility that fills null values in JSON data using LLM context
- **Multiple LLM Support**: OpenAI, Google Gemini, or local Ollama models
- **Extensible**: Easy to add new agents with custom tools or LLM-generated data

## Architecture

```
START -> Router -> [Arithmetic Agent | Flight Agent | Restaurant Agent | Unsupported] -> END
```

The router classifies user intent and directs the request to the appropriate agent. Each agent has access to domain-specific tools and can engage in multi-turn conversations to gather required information. Agents without tools can use the generator function to produce LLM-generated data instead.

## Installation

This project uses pnpm.

```bash
pnpm install
```

## Environment Variables

Create a `.env` file based on `.env.example`:

| Variable            | Description                           |
| ------------------- | ------------------------------------- |
| `PORT`              | Server port (default: 8000)           |
| `OPENAI_API_KEY`    | OpenAI API key                        |
| `GOOGLE_API_KEY`    | Google Gemini API key                 |
| `AMADEUS_API_TOKEN` | Amadeus API token for flight searches |

## Running the Server

**Development** (with hot reload):

```bash
pnpm run dev
```

**Production**:

```bash
pnpm run start
```

The Express server will start on `http://localhost:8000` (or your configured PORT).

## API Usage

### POST /chat

Send messages to the agent and receive responses.

**Request:**

```json
{
  "messages": [{ "type": "human", "content": "Find flights from LAX to JFK" }],
  "trip": {
    "origin": null,
    "destination": null,
    "departureDate": null,
    "returnDate": null,
    "budget": null
  }
}
```

**Response:**

```json
{
  "messages": [
    { "type": "human", "content": "Find flights from LAX to JFK" },
    { "type": "ai", "content": "What are your travel dates?" }
  ],
  "data": null,
  "trip": { ... },
  "debug": [ ... ]
}
```

### GET /health

Health check endpoint.

## Agents

### Arithmetic Agent

**Location:** `graph/nodes/arithmetic/`

Handles basic math operations (+, -, \*, /) between exactly two numbers using `createReactAgent` with dedicated tools.

### Flight Agent

**Location:** `graph/nodes/flight/`

Searches for round-trip flights using the Amadeus API. Uses `createReactAgent` with the `searchFlights` tool. Builds a dynamic system prompt with current trip context and asks for missing required fields (origin, destination, dates). After fetching results, it summarizes the flights with a separate LLM call.

### Restaurant Agent

**Location:** `graph/nodes/restaurant/`

Generates restaurant recommendations using the generator function instead of external API tools. This agent demonstrates the pattern for agents that don't have a third-party API integration.

**How it works:**

1. Checks if the Trip has a `destination`. If missing, it asks the user for one using a direct `model.invoke()` call.
2. Once a destination is available, it creates a template array of 3 `RestaurantResults` objects with all fields set to `null`.
3. Passes the templates and Trip context to the `generator()` function, which fills in the null values with contextually appropriate restaurant data.
4. Generates a conversational summary of the recommendations via a second LLM call.
5. Returns both the summary message and the structured `RestaurantResponseData`.

**Key difference from tool-based agents:** The restaurant agent does not use `createReactAgent` (which requires tools). Instead, it calls `model.invoke()` directly for conversation and the `generator()` utility for data generation.

**Example request:**

```json
{
  "messages": [
    { "type": "human", "content": "Find me some restaurants" }
  ],
  "trip": {
    "origin": "New York",
    "destination": "Tokyo",
    "departureFlight": null,
    "returnFlight": null,
    "departureDate": "2026-02-10",
    "returnDate": "2026-02-15",
    "budget": 3000,
    "hotel": "Park Hyatt Tokyo",
    "interests": ["sushi", "ramen"],
    "constraints": []
  }
}
```

## Generator Function

### Overview

**Location:** `utils/agents/generator.ts`

The generator is a generic utility that calls an LLM to fill `null` values in JSON data with contextually appropriate values. It serves two purposes:

1. **Supplementing API data**: When an agent fetches data from a third-party API but some fields are missing (e.g., flight prices returned as null), the generator fills in realistic estimates.
2. **Placeholder data**: When an agent has no API integration yet, the generator produces all the data based on context (e.g., the restaurant agent).

### Usage

```typescript
import { generator } from "../../../utils/agents/generator.js";

const results = await generator<MyType>({
  data: templateWithNulls,
  context: { destination: "Tokyo", budget: 3000 },
  description: "restaurant recommendations near the trip destination",
});
```

### Parameters

The generator accepts a `GeneratorOptions<T>` object:

| Parameter     | Type                       | Description                                                                                                            |
| ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `data`        | `T \| T[]`                 | A single object or array of objects with `null` values to be filled. Non-null values are preserved.                    |
| `context`     | `Record<string, unknown>`  | Contextual information the LLM uses to generate appropriate values. Can include any relevant data (Trip, hotel, etc.). |
| `description` | `string`                   | A natural language description of what kind of data is being generated.                                                |

**Returns:** `Promise<T[]>` -- always returns an array, even if a single object was provided as input.

### How It Works

1. **Normalizes input** -- wraps a single object in an array if needed.
2. **Scans for null fields** -- identifies which fields in the template are `null` and lists them explicitly in the LLM prompt.
3. **Calls the LLM** -- sends a system prompt instructing it to fill only null values, along with the context and data template.
4. **Parses the response** -- attempts `JSON.parse`, with a fallback that strips markdown code fences if the LLM wraps the JSON.
5. **Preserves non-null values** -- iterates over the results and overwrites any fields that were non-null in the original template back onto the output. This guards against the LLM modifying existing data.

### Examples

**Restaurant agent (all fields null):**

```typescript
const template: RestaurantResults = {
  name: null as unknown as string,
  location: null as unknown as string,
  cuisine: null as unknown as string,
};

const restaurants = await generator<RestaurantResults>({
  data: [template, template, template],
  context: { destination: "Tokyo", budget: 3000, interests: ["sushi"] },
  description: "restaurant recommendations near the trip destination",
});
// Returns 3 RestaurantResults with name, location, cuisine filled in
```

**Flight agent (partial null fields):**

```typescript
const flightsWithMissingPrices: FlightResults[] = [
  { airline: "ANA", price: null, currency: "USD", legs: [...] },
  { airline: "JAL", price: null, currency: "USD", legs: [...] },
];

const filled = await generator<FlightResults>({
  data: flightsWithMissingPrices,
  context: { route: "JFK to NRT", season: "winter" },
  description: "estimated flight prices based on route and season",
});
// Returns the same flights with price filled in, airline/currency/legs untouched
```

**Single object:**

```typescript
const hotel = await generator<HotelResults>({
  data: { name: "Park Hyatt", rating: null, pricePerNight: null },
  context: { destination: "Tokyo" },
  description: "hotel details for a luxury hotel in the destination city",
});
// Returns an array with one HotelResults, rating and pricePerNight filled in
```

## Supported Models

The application supports multiple LLM backends. To switch models, update the import in agent files:

```typescript
// OpenAI (default)
import { model } from "../../../models/openAi.js";

// Google Gemini
import { model } from "../../../models/gemini.js";

// Ollama (local)
import { model } from "../../../models/ollama.js";
```

## Extensibility Guide

### Adding a New Agent with Tools

Follow these steps to add a new agent that connects to an external API or uses tools:

#### 1. Add Intent Type

Update `types/intents.ts`:

```typescript
export type Intent = "arithmetic" | "flights" | "restaurant" | "hotels" | "unsupported";
```

#### 2. Update Intent Classifier

Modify the system prompt in `graph/nodes/supervisor/utils/classifyIntent.ts` to include the new intent category and classification rules.

#### 3. Add Routing Case

Update `graph/nodes/supervisor/router.ts`:

```typescript
case "hotels":
  return "hotelAgent";
```

#### 4. Create Agent Node

Create a new folder `graph/nodes/hotel/` with:

- `hotelNode.ts` - Agent node implementation using `createReactAgent`
- `tools.ts` - Tool bindings for the agent
- `utils/` - Optional utility functions (formatting, summarization, etc.)

**Agent Node Template:**

```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { model } from "../../../models/openAi.js";
import { hotelTools } from "./tools.js";
import type { AgentStateType } from "../../state.js";

const systemPrompt = `You are a helpful hotel booking assistant...`;

const hotelAgent = createReactAgent({
  llm: model,
  tools: hotelTools,
  messageModifier: new SystemMessage(systemPrompt),
});

export async function hotelNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const result = await hotelAgent.invoke({ messages: state.messages });
  // Process results and return updated state
  return { messages: result.messages };
}
```

#### 5. Create Tools

Add tool implementations in `tools/hotel/`:

```typescript
import { tool } from "@langchain/core/tools";
import * as z from "zod";

export const searchHotels = tool(
  async ({ location, checkIn, checkOut }) => {
    // Implementation
  },
  {
    name: "searchHotels",
    description: "Searches for hotels in a given location",
    schema: z.object({
      location: z.string().describe("City or area to search"),
      checkIn: z.string().describe("Check-in date (YYYY-MM-DD)"),
      checkOut: z.string().describe("Check-out date (YYYY-MM-DD)"),
    }),
  },
);
```

#### 6. Add Response Data Type

Update `types/api.ts`:

```typescript
export interface HotelResponseData {
  type: "hotel";
  summary?: string;
  options?: HotelResults[];
}

export type ResponseData =
  | ArithmeticResponseData
  | FlightResponseData
  | RestaurantResponseData
  | HotelResponseData;
```

#### 7. Wire Into Graph

Update `graph/index.ts`:

```typescript
import { hotelNode } from "./nodes/hotel/hotelNode.js";

// Add to workflow:
.addNode("hotelAgent", hotelNode)
.addEdge("hotelAgent", END)
```

### Adding a New Agent without Tools

For agents that don't have an external API, use the generator function instead of `createReactAgent`. The restaurant agent (`graph/nodes/restaurant/restaurantNode.ts`) is the reference implementation for this pattern.

#### Key differences from tool-based agents:

1. **No `createReactAgent`** -- `createReactAgent` requires a non-empty tools array. Instead, use `model.invoke()` directly for conversational LLM calls.
2. **Use the generator for data** -- Create a template of your result type with null fields and pass it to `generator()` with relevant context.
3. **Check for required context** -- Validate that necessary Trip fields (e.g., `destination`) exist before generating. If missing, return an AIMessage asking the user.

#### Agent Node Template (no tools):

```typescript
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { model } from "../../../models/openAi.js";
import { generator } from "../../../utils/agents/generator.js";
import type { MyResultType } from "../../../types/myDomain/myType.js";
import type { AgentStateType } from "../../state.js";

export async function myNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const trip = state.trip;

  // Check for required context
  if (!trip.destination) {
    const response = await model.invoke([
      new SystemMessage("Ask for the missing destination."),
      ...state.messages.slice(-6),
    ]);
    return { messages: [...state.messages, new AIMessage(response.content as string)] };
  }

  // Create templates with null fields for the generator to fill
  const template: MyResultType = {
    field1: null as unknown as string,
    field2: null as unknown as string,
  };

  const results = await generator<MyResultType>({
    data: [template, template, template],
    context: { destination: trip.destination, budget: trip.budget },
    description: "description of what to generate",
  });

  return {
    messages: [...state.messages, new AIMessage("Here are your results...")],
    data: { type: "myDomain", options: results },
  };
}
```

## Project Structure

```
multi-agent-example/
├── graph/
│   ├── index.ts              # Graph definition
│   ├── state.ts              # State annotation
│   └── nodes/
│       ├── arithmetic/       # Arithmetic agent (tool-based)
│       ├── flight/           # Flight agent (tool-based)
│       ├── restaurant/       # Restaurant agent (generator-based)
│       ├── supervisor/       # Router and intent classification
│       └── unsupportedNode.ts
├── models/                   # LLM configurations
├── tools/                    # Tool implementations
├── types/                    # TypeScript types
├── utils/
│   └── agents/
│       ├── extractLastToolJson.ts  # Extract JSON from tool messages
│       └── generator.ts            # Generic LLM data generator
├── docs/
│   └── APP-CONTEXT.md        # Technical documentation
└── index.ts                  # Express server
```

## Learning Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [LangChain.js Documentation](https://js.langchain.com/docs/)
