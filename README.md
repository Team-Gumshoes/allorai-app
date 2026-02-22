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
  - [POST /tips](#post-tips)
  - [GET /health](#get-health)
- [Agents](#agents)
  - [Arithmetic Agent](#arithmetic-agent)
  - [Flight Agent](#flight-agent)
  - [Restaurant Agent](#restaurant-agent)
  - [Hotel Agent](#hotel-agent)
  - [Activities Agent](#activities-agent)
  - [Nature Activities Agent](#nature-activities-agent)
  - [Selfie Agent](#selfie-agent)
  - [Tips Agent](#tips-agent)
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
- **Flight Agent**: Search for round-trip flights using the Amadeus API (or LLM-generated fallback)
- **Restaurant Agent**: Restaurant recommendations via Google Places API or LLM generator fallback
- **Hotel Agent**: Hotel recommendations via Google Places API or LLM generator fallback
- **Activities Agent**: Tourist attraction and activity recommendations via Google Places API or LLM generator fallback
- **Nature Activities Agent**: Nature spot recommendations (parks, trails, national parks) via Google Places API or LLM generator fallback
- **Selfie Agent**: Selfie spot recommendations via Google Places API or LLM generator fallback
- **Tips Agent**: LLM-generated travel tips (transport, when to visit, safety) via a dedicated `/tips` endpoint
- **Generator Function**: Generic utility that fills null values in JSON data using LLM context
- **Google Places API**: Real venue data for hotel, restaurant, activities, nature, and selfie agents with LLM fallback
- **Dynamic Model Loading**: `loadModel()` selects the LLM per task tier (fast/standard/smart) based on environment variables — no code changes needed to switch models
- **Extensible**: Easy to add new agents with custom tools or LLM-generated data

## Architecture

```
START -> Router -> [Arithmetic Agent | Flight Agent | Hotel Agent | Restaurant Agent | Activities Agent | Nature Agent | Selfie Agent | Unsupported] -> END
```

The router classifies user intent and directs the request to the appropriate agent. Each agent has access to domain-specific tools and can engage in multi-turn conversations to gather required information. Agents without tools can use the Google Places API or the generator function to produce data.

## Installation

This project uses pnpm.

```bash
pnpm install
```

## Environment Variables

Create a `.env` file based on `.env.example`:

| Variable                | Description                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| `PORT`                  | Server port (default: 8000)                                          |
| `OPENAI_API_KEY`        | OpenAI API key                                                       |
| `GOOGLE_API_KEY`        | Google Gemini API key                                                |
| `AMADEUS_CLIENT_ID`     | Amadeus API client ID for OAuth2                                     |
| `AMADEUS_CLIENT_SECRET` | Amadeus API client secret for OAuth2                                 |
| `AMADEUS_GRANT_TYPE`    | Amadeus OAuth2 grant type                                            |
| `USE_FLIGHT_API`        | `"true"` to use Amadeus API, `"false"` for LLM-generated flight data |
| `GOOGLE_PLACES_API_KEY` | Google Places API key                                                |
| `USE_PLACES_API`        | `"true"` to use Google Places API, `"false"` for LLM-generated data  |
| `GENERATE_SUMMARIES`    | `"true"` to generate LLM summaries, `"false"` to skip (returns empty string) |
| `FAST_MODEL_COMPANY`    | Model provider for the fast tier: `OpenAI`, `GoogleGemini`, or `Ollama` |
| `FAST_MODEL_NAME`       | Model name for the fast tier (e.g. `qwen2.5:3b`)                    |
| `STANDARD_MODEL_COMPANY`| Model provider for the standard tier                                 |
| `STANDARD_MODEL_NAME`   | Model name for the standard tier (e.g. `gpt-4o-mini`)               |
| `SMART_MODEL_COMPANY`   | Model provider for the smart tier                                    |
| `SMART_MODEL_NAME`      | Model name for the smart tier (e.g. `gpt-5-nano`)                   |

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
    "budget": null,
    "destinationCoords": null,
    "hotelCoords": null
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
}
```

### POST /tips

Generate travel tips for a trip destination. This endpoint is separate from the graph-based `/chat` route and calls the generator function directly.

**Request (`TipsRequest`):**

```json
{
  "trip": {
    "origin": "New York",
    "destination": "Tokyo",
    "departureDate": "2026-03-01",
    "returnDate": "2026-03-07",
    "budget": 3000,
    "hotel": "Park Hyatt Tokyo",
    "interests": ["sushi", "temples"],
    "constraints": []
  }
}
```

**Response (`TipsResponse`):**

```json
{
  "data": {
    "type": "tips",
    "options": [
      {
        "id": "abc123",
        "transportTips": "Tokyo's train system is extensive and efficient...",
        "whenToVisitTips": "Spring (March-April) is ideal for cherry blossoms...",
        "safetyTips": "Tokyo is one of the safest major cities in the world..."
      }
    ]
  },
  "trip": { ... }
}
```

**Note:** A `trip.destination` is required. The endpoint returns a 400 error if the destination is missing.

### GET /health

Health check endpoint.

## Agents

### Arithmetic Agent

**Location:** `graph/nodes/arithmetic/`

Handles basic math operations (+, -, \*, /) between exactly two numbers using `createReactAgent` with dedicated tools.

### Flight Agent

**Location:** `graph/nodes/flight/`

Searches for round-trip flights using the Amadeus API. Uses `createReactAgent` with the `searchFlights` tool. Builds a dynamic system prompt with current trip context and asks for missing required fields (origin, destination, dates). After fetching results, it summarizes the flights with a separate LLM call.

When `USE_FLIGHT_API=false`, the agent falls back to LLM-generated flight data via the generator function.

### Restaurant Agent

**Location:** `graph/nodes/restaurant/`

Generates restaurant recommendations using the Google Places API when coordinates are available, with the generator function as a fallback.

**How it works:**

1. Checks if the Trip has a `destination`. If missing, it asks the user for one using a direct `model.invoke()` call.
2. If `USE_PLACES_API=true` and `trip.hotelCoords` is set, fetches real restaurant data from Google Places API via `searchNearbyPlaces`.
3. Otherwise, creates a template array of `RestaurantResults` objects with all fields set to `null` and passes them to `generator()`.
4. Generates a conversational summary of the recommendations via a second LLM call (if `GENERATE_SUMMARIES=true`).
5. Returns both the summary message and the structured `RestaurantResponseData`.

**Example request:**

```json
{
  "messages": [{ "type": "human", "content": "Find me some restaurants" }],
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
    "constraints": [],
    "destinationCoords": { "latitude": 35.6762, "longitude": 139.6503 },
    "hotelCoords": { "latitude": 35.6892, "longitude": 139.6922 }
  }
}
```

### Hotel Agent

**Location:** `graph/nodes/hotel/`

Generates hotel recommendations using the Google Places API when destination coordinates are available, with the generator function as a fallback.

**How it works:**

1. Checks if the Trip has a `destination`. If missing, it asks the user for one using a direct `model.invoke()` call.
2. If `USE_PLACES_API=true` and `trip.destinationCoords` is set, fetches real hotel data from Google Places API via `searchNearbyPlaces`.
3. Otherwise, creates a template array of 5 `HotelResults` objects with all fields set to `null` and passes them to `generator()`.
4. Generates a conversational summary of the recommendations via a second LLM call (if `GENERATE_SUMMARIES=true`).
5. Returns both the summary message and the structured `HotelResponseData`.

**Example request:**

```json
{
  "messages": [{ "type": "human", "content": "Find me some hotels" }],
  "trip": {
    "origin": "New York",
    "destination": "Tokyo",
    "departureFlight": null,
    "returnFlight": null,
    "departureDate": "2026-02-10",
    "returnDate": "2026-02-15",
    "budget": 3000,
    "hotel": null,
    "interests": ["sightseeing"],
    "constraints": [],
    "destinationCoords": { "latitude": 35.6762, "longitude": 139.6503 },
    "hotelCoords": null
  }
}
```

### Activities Agent

**Location:** `graph/nodes/activities/`

Generates tourist attraction and activity recommendations using the Google Places API when hotel coordinates are available, with the generator function as a fallback.

**How it works:**

1. Checks if the Trip has a `destination`. If missing, it asks the user for one using a direct `model.invoke()` call.
2. If `USE_PLACES_API=true` and `trip.hotelCoords` is set, fetches real activity data from Google Places API via `searchNearbyPlaces` (searches for tourist attractions, museums, amusement parks, art galleries, and zoos).
3. Otherwise, creates a template array of 10 `Activities` objects with all fields set to `null` and passes them to `generator()`.
4. Generates a conversational summary of the recommendations via a second LLM call (if `GENERATE_SUMMARIES=true`).
5. Returns both the summary message and the structured `ActivitiesResponseData`.

**Example request:**

```json
{
  "messages": [{ "type": "human", "content": "What activities can I do in Tokyo?" }],
  "trip": {
    "origin": "New York",
    "destination": "Tokyo",
    "departureFlight": null,
    "returnFlight": null,
    "departureDate": "2026-03-01",
    "returnDate": "2026-03-07",
    "budget": 4000,
    "hotel": "Park Hyatt Tokyo",
    "interests": ["culture", "history"],
    "constraints": [],
    "destinationCoords": { "latitude": 35.6762, "longitude": 139.6503 },
    "hotelCoords": { "latitude": 35.6892, "longitude": 139.6922 }
  }
}
```

### Nature Activities Agent

**Location:** `graph/nodes/nature/`

Generates nature spot recommendations (parks, national parks, hiking areas, campgrounds) using the Google Places API when hotel coordinates are available, with the generator function as a fallback.

**How it works:**

1. Checks if the Trip has a `destination`. If missing, it asks the user for one using a direct `model.invoke()` call.
2. If `USE_PLACES_API=true` and `trip.hotelCoords` is set, fetches real nature spot data from Google Places API via `searchNearbyPlaces` (searches for parks, national parks, campgrounds, and hiking areas).
3. Otherwise, creates a template array of 5 `Nature` objects with all fields set to `null` and passes them to `generator()`.
4. Generates a conversational summary of the recommendations via a second LLM call (if `GENERATE_SUMMARIES=true`).
5. Returns both the summary message and the structured `NatureResponseData`.

**Example request:**

```json
{
  "messages": [{ "type": "human", "content": "Where can I enjoy nature near Tokyo?" }],
  "trip": {
    "origin": "New York",
    "destination": "Tokyo",
    "departureFlight": null,
    "returnFlight": null,
    "departureDate": "2026-03-01",
    "returnDate": "2026-03-07",
    "budget": 4000,
    "hotel": "Park Hyatt Tokyo",
    "interests": ["hiking", "nature"],
    "constraints": [],
    "destinationCoords": { "latitude": 35.6762, "longitude": 139.6503 },
    "hotelCoords": { "latitude": 35.6892, "longitude": 139.6922 }
  }
}
```

### Selfie Agent

**Location:** `graph/nodes/selfie/`

Generates selfie spot recommendations using the Google Places API when hotel coordinates are available, with the generator function as a fallback.

**How it works:**

1. Checks if the Trip has a `destination`. If missing, it asks the user for one using a direct `model.invoke()` call.
2. If `USE_PLACES_API=true` and `trip.hotelCoords` is set, fetches real location data from Google Places API via `searchNearbyPlaces` (searches for tourist attractions, museums, art galleries, and zoos).
3. Otherwise, creates a template array of 5 `SelfieSpots` objects with all fields set to `null` and passes them to `generator()`.
4. Generates a conversational summary of the recommendations via a second LLM call (if `GENERATE_SUMMARIES=true`).
5. Returns both the summary message and the structured `SelfieResponseData`.

**Example request:**

```json
{
  "messages": [
    { "type": "human", "content": "Where can I take good selfies in Tokyo?" }
  ],
  "trip": {
    "origin": "New York",
    "destination": "Tokyo",
    "departureFlight": null,
    "returnFlight": null,
    "departureDate": "2026-03-01",
    "returnDate": "2026-03-07",
    "budget": 4000,
    "hotel": "Park Hyatt Tokyo",
    "interests": ["photography", "culture"],
    "constraints": [],
    "destinationCoords": { "latitude": 35.6762, "longitude": 139.6503 },
    "hotelCoords": { "latitude": 35.6892, "longitude": 139.6922 }
  }
}
```

### Tips Agent

**Location:** `graph/nodes/tips/`

Generates travel tips using the generator function. Unlike other agents, the tips agent is **not routed through the graph** -- it has its own dedicated `POST /tips` endpoint that calls the generator directly.

**How it works:**

1. Receives a `ChatRequest` via `POST /tips` with a Trip that includes a `destination`.
2. Creates a single `Tips` template with `id` pre-filled and all tip fields set to `null`.
3. Passes the template and Trip context to the `generator()` function, which fills in each tip field with 2-4 sentences.
4. Returns a `ChatResponse` with the generated tips in the `data` field.

**Tip categories:**

- **transportTips**: Useful transportation tips for visitors at the destination.
- **whenToVisitTips**: Best times to visit, crowd avoidance, upcoming holidays and festivals.
- **safetyTips**: Tips for avoiding dangerous areas and staying safe during the trip.

## Generator Function

### Overview

**Location:** `utils/agents/generator.ts`

The generator is a generic utility that calls an LLM to fill `null` values in JSON data with contextually appropriate values. It serves two purposes:

1. **Supplementing API data**: When an agent fetches data from a third-party API but some fields are missing (e.g., flight prices returned as null), the generator fills in realistic estimates.
2. **Placeholder data**: When an agent has no API integration or coordinates are unavailable, the generator produces all the data based on context (e.g., when `USE_PLACES_API=false`).

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

| Parameter     | Type                      | Description                                                                                                            |
| ------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `data`        | `T \| T[]`                | A single object or array of objects with `null` values to be filled. Non-null values are preserved.                    |
| `context`     | `Record<string, unknown>` | Contextual information the LLM uses to generate appropriate values. Can include any relevant data (Trip, hotel, etc.). |
| `description` | `string`                  | A natural language description of what kind of data is being generated.                                                |

**Returns:** `Promise<T[]>` -- always returns an array, even if a single object was provided as input.

### How It Works

1. **Normalizes input** -- wraps a single object in an array if needed.
2. **Scans for null fields** -- identifies which fields in the template are `null` and lists them explicitly in the LLM prompt.
3. **Calls the LLM** -- sends a system prompt instructing it to fill only null values, along with the context and data template.
4. **Parses the response** -- attempts `JSON.parse`, with a fallback that strips markdown code fences if the LLM wraps the JSON.
5. **Preserves non-null values** -- iterates over the results and overwrites any fields that were non-null in the original template back onto the output. This guards against the LLM modifying existing data.

### Examples

**Activities agent (all fields null, Places API disabled):**

```typescript
const template: Activities = {
  id: nanoid(),
  name: null as unknown as string,
  location: null as unknown as string,
  description: null as unknown as string,
  website: null as unknown as string,
};

const activities = await generator<Activities>({
  data: Array.from({ length: 10 }, () => template),
  context: { destination: "Tokyo", budget: 4000, interests: ["culture"] },
  description: "activity recommendations near the trip destination",
});
// Returns 10 Activities with all fields filled in
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

Model selection is driven entirely by environment variables -- no code changes are needed to switch LLMs.

### Model Tiers

The `loadModel()` function (`utils/agents/loadModel.ts`) dynamically instantiates an LLM based on the tier requested:

| Tier       | Used by                                            | Env vars                                          |
| ---------- | -------------------------------------------------- | ------------------------------------------------- |
| `fast`     | `classifyIntent` (routing / classification)        | `FAST_MODEL_COMPANY`, `FAST_MODEL_NAME`           |
| `standard` | `arithmeticNode`, `summarizeFlights`               | `STANDARD_MODEL_COMPANY`, `STANDARD_MODEL_NAME`   |
| `smart`    | All travel-planning nodes + `generator()`          | `SMART_MODEL_COMPANY`, `SMART_MODEL_NAME`         |

### Supported Providers

Set `[TIER]_MODEL_COMPANY` to one of the following values:

| Value           | Provider        |
| --------------- | --------------- |
| `OpenAI`        | OpenAI GPT      |
| `GoogleGemini`  | Google Gemini   |
| `Ollama`        | Local Ollama    |

### Example Configuration

```bash
# Fast tier: local Ollama model for quick classification
FAST_MODEL_COMPANY=Ollama
FAST_MODEL_NAME=qwen2.5:3b

# Standard tier: OpenAI for moderate reasoning tasks
STANDARD_MODEL_COMPANY=OpenAI
STANDARD_MODEL_NAME=gpt-4o-mini

# Smart tier: OpenAI for full generation tasks
SMART_MODEL_COMPANY=OpenAI
SMART_MODEL_NAME=gpt-5-nano
```

## Extensibility Guide

### Adding a New Agent with Tools

Follow these steps to add a new agent that connects to an external API or uses tools:

#### 1. Add Intent Type

Update `types/intents.ts`:

```typescript
export type Intent =
  | "arithmetic"
  | "flights"
  | "hotel"
  | "restaurant"
  | "activities"
  | "nature"
  | "selfie"
  | "unsupported";
```

#### 2. Update Intent Classifier

Modify the system prompt in `graph/nodes/supervisor/utils/classifyIntent.ts` to include the new intent category and classification rules.

#### 3. Add Routing Case

Update `graph/nodes/supervisor/router.ts`:

```typescript
case "hotel":
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
import { loadModel } from "../../../utils/agents/loadModel.js";
import { hotelTools } from "./tools.js";
import type { AgentStateType } from "../../state.js";

const systemPrompt = `You are a helpful hotel booking assistant...`;

const model = loadModel("smart");

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
  | HotelResponseData
  | RestaurantResponseData;
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

For agents that don't have an external API, use the generator function instead of `createReactAgent`. The activities agent (`graph/nodes/activities/activityNode.ts`) is a reference implementation for this pattern with Places API + generator fallback.

#### Key differences from tool-based agents:

1. **No `createReactAgent`** -- `createReactAgent` requires a non-empty tools array. Instead, use `model.invoke()` directly for conversational LLM calls.
2. **Use Places API or generator for data** -- Check `USE_PLACES_API` and coordinates; if available, call `searchNearbyPlaces()`. Otherwise create a template of your result type with null fields and pass it to `generator()`.
3. **Check for required context** -- Validate that necessary Trip fields (e.g., `destination`) exist before generating. If missing, return an AIMessage asking the user.

#### Agent Node Template (no tools):

```typescript
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { loadModel } from "../../../utils/agents/loadModel.js";
import { generator } from "../../../utils/agents/generator.js";
import { searchNearbyPlaces } from "../../../tools/travel/searchNearbyPlaces.js";
import type { MyResultType } from "../../../types/myDomain/myType.js";
import type { AgentStateType } from "../../state.js";

const USE_PLACES_API = process.env.USE_PLACES_API === "true";
const GENERATE_SUMMARIES = process.env.GENERATE_SUMMARIES === "true";
const model = loadModel("smart");

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
    return {
      messages: [...state.messages, new AIMessage(response.content as string)],
    };
  }

  let results: MyResultType[];

  if (USE_PLACES_API && trip.hotelCoords) {
    results = (await searchNearbyPlaces({
      type: "activities",
      latitude: trip.hotelCoords.latitude,
      longitude: trip.hotelCoords.longitude,
    })) as MyResultType[];
  } else {
    const template: MyResultType = {
      field1: null as unknown as string,
      field2: null as unknown as string,
    };
    results = await generator<MyResultType>({
      data: [template, template, template],
      context: { destination: trip.destination, budget: trip.budget },
      description: "description of what to generate",
    });
  }

  let summary = "";
  if (GENERATE_SUMMARIES) {
    const summaryResponse = await model.invoke([
      new SystemMessage("Briefly summarize these recommendations."),
      new HumanMessage(JSON.stringify(results, null, 2)),
    ]);
    summary = summaryResponse.content as string;
  }

  return {
    messages: [...state.messages, new AIMessage(summary || "Here are your results...")],
    data: { type: "myDomain", summary, options: results },
  };
}
```

## Project Structure

```
multi-agent-example/
├── data/
│   └── airports/
│       └── airports.json         # IATA airport lookup table
├── graph/
│   ├── index.ts              # Graph definition
│   ├── state.ts              # State annotation
│   └── nodes/
│       ├── arithmetic/       # Arithmetic agent (tool-based)
│       ├── flight/           # Flight agent (tool-based)
│       ├── hotel/            # Hotel agent (Places API + generator)
│       ├── restaurant/       # Restaurant agent (Places API + generator)
│       ├── activities/       # Activities agent (Places API + generator)
│       ├── nature/           # Nature agent (Places API + generator)
│       ├── selfie/           # Selfie agent (Places API + generator)
│       ├── tips/             # Tips agent (generator-based, standalone route)
│       ├── supervisor/       # Router and intent classification
│       └── unsupportedNode.ts
├── models/                   # LLM configurations
├── tools/                    # Tool implementations
│   ├── arithmetic/
│   └── travel/
│       ├── searchFlights.ts
│       ├── searchNearbyPlaces.ts  # Google Places API integration
│       └── validateAirport.ts    # IATA code validation + coords lookup
├── types/                    # TypeScript types
├── utils/
│   └── agents/
│       ├── extractLastToolJson.ts  # Extract JSON from tool messages
│       ├── generator.ts            # Generic LLM data generator
│       └── loadModel.ts            # Dynamic model loader
├── docs/
│   └── APP-CONTEXT.md        # Technical documentation
└── index.ts                  # Express server
```

## Learning Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [LangChain.js Documentation](https://js.langchain.com/docs/)
