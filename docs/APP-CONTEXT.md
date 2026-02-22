# Trip Planning Multi-Agent Application

A trip planning application built with LangChain's LangGraph technology, implementing a supervisor pattern with multiple specialized AI agents.

## Architecture Overview

This application uses a **supervisor pattern** where a central supervisor agent analyzes user intent and routes requests to specialized agents. Each agent operates as a separate node in the graph with access to domain-specific tools, the Google Places API, or the generator function for LLM-generated data.

```
START -> Router -> [Arithmetic Agent | Flight Agent | Hotel Agent | Restaurant Agent | Activities Agent | Nature Agent | Selfie Agent | Unsupported Node] -> END
```

### Three Agent Patterns

The system supports three types of agent nodes:

1. **Tool-based agents** use `createReactAgent` from LangGraph with external API tools. The arithmetic and flight agents follow this pattern.
2. **Places API + Generator agents** first attempt to fetch real data from the Google Places API (when `USE_PLACES_API=true` and coordinates are available), then fall back to the `generator()` utility if not. The hotel, restaurant, activities, nature, and selfie agents follow this pattern.
3. **Generator-only agents** use the `generator()` utility exclusively. The tips agent follows this pattern.

### Current Agents

| Agent      | Purpose                                                                    | Pattern                 | Data Source                              |
| ---------- | -------------------------------------------------------------------------- | ----------------------- | ---------------------------------------- |
| Arithmetic | Basic math operations (+, -, \*, /) between two numbers                    | Tool                    | add, subtract, multiply, divide          |
| Flight     | Flight search using Amadeus API                                            | Tool                    | searchFlights (or generator fallback)    |
| Hotel      | Hotel recommendations based on Trip context                                | Places API + Generator  | searchNearbyPlaces, generator()          |
| Restaurant | Restaurant recommendations based on Trip context                           | Places API + Generator  | searchNearbyPlaces, generator()          |
| Activities | Tourist attraction and activity recommendations based on Trip context       | Places API + Generator  | searchNearbyPlaces, generator()          |
| Nature     | Nature spot recommendations (parks, trails) based on Trip context          | Places API + Generator  | searchNearbyPlaces, generator()          |
| Selfie     | Selfie spot recommendations based on Trip context                          | Places API + Generator  | searchNearbyPlaces, generator()          |
| Tips       | Transport, when-to-visit, and safety tips (standalone `/tips` route)       | Generator               | generator()                              |
| Unsupported| Fallback for unrecognized requests                                         | None                    | None                                     |

## Graph Structure

The graph is defined in `graph/index.ts` using LangGraph's `StateGraph`:

```typescript
const workflow = new StateGraph(AgentState)
  .addNode("router", routerNode)
  .addNode("arithmeticAgent", arithmeticNode)
  .addNode("flightAgent", flightNode)
  .addNode("hotelAgent", hotelNode)
  .addNode("restaurantAgent", restaurantNode)
  .addNode("activitiesAgent", activityNode)
  .addNode("natureAgent", natureNode)
  .addNode("selfieAgent", selfieNode)
  .addNode("unsupportedNode", unsupportedNode)
  .addEdge(START, "router")
  .addConditionalEdges("router", routeByIntent)
  .addEdge("arithmeticAgent", END)
  .addEdge("flightAgent", END)
  .addEdge("hotelAgent", END)
  .addEdge("restaurantAgent", END)
  .addEdge("activitiesAgent", END)
  .addEdge("natureAgent", END)
  .addEdge("selfieAgent", END)
  .addEdge("unsupportedNode", END);

export const graph = workflow.compile();
```

### State Management

The graph state is defined in `graph/state.ts` and extends LangChain's `MessagesAnnotation`:

```typescript
export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  intent: Annotation<Intent | null>({
    default: () => null,
    reducer: (_, y) => y,
  }),
  trip: Annotation<Trip>({
    default: () => createEmptyTrip(),
    reducer: (_, y) => y,
  }),
  data: Annotation<ResponseData | null>({
    default: () => null,
    reducer: (_, y) => y,
  }),
});
```

| Field      | Type                   | Purpose                                                  |
| ---------- | ---------------------- | -------------------------------------------------------- |
| `messages` | `BaseMessage[]`        | Conversation history (from MessagesAnnotation)           |
| `intent`   | `Intent \| null`       | Classified intent for routing                            |
| `trip`     | `Trip`                 | Trip planning context (origin, destination, dates, etc.) |
| `data`     | `ResponseData \| null` | Extracted data from tool calls, Places API, or generator |

## Agents

### Supervisor Agent (Router)

**Location:** `graph/nodes/supervisor/`

The router classifies user intent and determines which agent should handle the request.

**Files:**

- `router.ts` - Router node and routing logic
- `utils/classifyIntent.ts` - Intent classification using LLM

**Intent Classification:**

- Examines the last 6 messages (3 conversation turns) for context
- Handles follow-up questions intelligently (maintains intent during clarification)
- Returns one of: `arithmetic`, `flights`, `hotel`, `restaurant`, `activities`, `nature`, `selfie`, or `unsupported`

```typescript
export function routeByIntent(state: AgentStateType): string {
  switch (state.intent) {
    case "arithmetic":
      return "arithmeticAgent";
    case "flights":
      return "flightAgent";
    case "hotel":
      return "hotelAgent";
    case "restaurant":
      return "restaurantAgent";
    case "activities":
      return "activitiesAgent";
    case "nature":
      return "natureAgent";
    case "selfie":
      return "selfieAgent";
    default:
      return "unsupportedNode";
  }
}
```

### Arithmetic Agent

**Location:** `graph/nodes/arithmetic/`

Handles basic arithmetic operations between exactly two numbers.

**Files:**

- `arithmeticNode.ts` - Agent node implementation
- `tools.ts` - Tool bindings

**Tools:**

- `add` - Adds two numbers
- `subtract` - Subtracts two numbers
- `multiply` - Multiplies two numbers
- `divide` - Divides two numbers

**Limitations:**

- Only works with exactly two numbers
- No support for: derivatives, square roots, exponents, variables, or operations on 3+ numbers

**Implementation Pattern:**

```typescript
const arithmeticAgent = createReactAgent({
  llm: model,
  tools: arithmeticTools,
  messageModifier: new SystemMessage(arithmeticSystemPrompt),
});
```

### Flight Agent

**Location:** `graph/nodes/flight/`

Searches for round-trip flights using the Amadeus API when `USE_FLIGHT_API=true`, with LLM-generated fallback.

**Files:**

- `flightNode.ts` - Agent node with dynamic system prompt
- `tools.ts` - Tool bindings
- `utils/summarizeFlights.ts` - LLM-based flight summarization

**Tools:**

- `searchFlights` - Searches Amadeus API for round-trip flights
- `validateAirport` - Validates IATA airport codes against local `airports.json` and returns coordinates

**Dynamic System Prompt:**
The flight agent builds a context-aware system prompt that includes current trip details and missing required fields:

- Origin city/airport
- Destination city/airport
- Departure date
- Return date

**Post-Processing:**
After fetching flight data, the agent uses `summarizeFlights()` to generate a human-readable summary using a separate LLM call.

### Hotel Agent

**Location:** `graph/nodes/hotel/`

Generates hotel recommendations using the Google Places API when destination coordinates are available, falling back to the generator function.

**Files:**

- `hotelNode.ts` - Agent node implementation

**How it works:**

1. **Check context:** Validates that `trip.destination` exists. If missing, uses `model.invoke()` to ask the user for it.
2. **Fetch data:** If `USE_PLACES_API=true` and `trip.destinationCoords` is set, calls `searchNearbyPlaces({ type: "hotel", ... })` to fetch real hotel data. Otherwise, creates 5 `HotelResults` templates with all fields set to `null` and passes them to `generator()`.
3. **Summarize:** If `GENERATE_SUMMARIES=true`, generates a conversational summary via a second LLM call.
4. Returns both the summary message and the structured `HotelResponseData`.

**Response data type:**

```typescript
export interface HotelResponseData {
  type: "hotel";
  summary?: string;
  options?: HotelResults[];
}
```

### Restaurant Agent

**Location:** `graph/nodes/restaurant/`

Generates restaurant recommendations using the Google Places API when hotel coordinates are available, falling back to the generator function.

**Files:**

- `restaurantNode.ts` - Agent node implementation

**How it works:**

1. **Check context:** Validates that `trip.destination` exists. If missing, uses `model.invoke()` to ask the user for it.
2. **Fetch data:** If `USE_PLACES_API=true` and `trip.hotelCoords` is set, calls `searchNearbyPlaces({ type: "restaurant", ... })` to fetch real restaurant data. Otherwise, creates `RestaurantResults` templates with all fields set to `null` and passes them to `generator()`.
3. **Summarize:** If `GENERATE_SUMMARIES=true`, generates a conversational summary via a second LLM call.
4. Returns both the summary message and the structured `RestaurantResponseData`.

**Why not `createReactAgent`:** `createReactAgent` requires a non-empty tools array. Since these agents call `searchNearbyPlaces` directly (not as a LangChain tool), they use direct `model.invoke()` for conversation and the Places API / generator for data production.

**Context passed to generator:**

```typescript
function buildTripContext(trip: Trip): Record<string, unknown> {
  return {
    destination: trip.destination,
    origin: trip.origin,
    budget: trip.budget,
    hotel: trip.hotel,
    interests: trip.interests,
    constraints: trip.constraints,
  };
}
```

**Response data type:**

```typescript
export interface RestaurantResponseData {
  type: "restaurant";
  summary?: string;
  options?: RestaurantResults[];
}
```

### Activities Agent

**Location:** `graph/nodes/activities/`

Generates tourist attraction and activity recommendations using the Google Places API when hotel coordinates are available, falling back to the generator function.

**Files:**

- `activityNode.ts` - Agent node implementation

**How it works:**

1. **Check context:** Validates that `trip.destination` exists. If missing, uses `model.invoke()` to ask the user for it.
2. **Fetch data:** If `USE_PLACES_API=true` and `trip.hotelCoords` is set, calls `searchNearbyPlaces({ type: "activities", ... })` which searches for tourist attractions, amusement parks, museums, art galleries, and zoos. Otherwise, creates 10 `Activities` templates with all fields set to `null` and passes them to `generator()`.
3. **Summarize:** If `GENERATE_SUMMARIES=true`, generates a conversational summary via a second LLM call.
4. Returns both the summary message and the structured `ActivitiesResponseData`.

**Response data type:**

```typescript
export interface ActivitiesResponseData {
  type: "activities";
  summary?: string;
  options?: Activities[];
}
```

### Nature Activities Agent

**Location:** `graph/nodes/nature/`

Generates nature spot recommendations using the Google Places API when hotel coordinates are available, falling back to the generator function.

**Files:**

- `natureNode.ts` - Agent node implementation

**How it works:**

1. **Check context:** Validates that `trip.destination` exists. If missing, uses `model.invoke()` to ask the user for it.
2. **Fetch data:** If `USE_PLACES_API=true` and `trip.hotelCoords` is set, calls `searchNearbyPlaces({ type: "nature", ... })` which searches for parks, national parks, campgrounds, and hiking areas. Otherwise, creates 5 `Nature` templates with all fields set to `null` and passes them to `generator()`.
3. **Summarize:** If `GENERATE_SUMMARIES=true`, generates a conversational summary via a second LLM call.
4. Returns both the summary message and the structured `NatureResponseData`.

**Response data type:**

```typescript
export interface NatureResponseData {
  type: "nature";
  summary?: string;
  options?: Nature[];
}
```

### Selfie Agent

**Location:** `graph/nodes/selfie/`

Generates selfie spot recommendations using the Google Places API when hotel coordinates are available, falling back to the generator function.

**Files:**

- `selfieNode.ts` - Agent node implementation

**How it works:**

1. **Check context:** Validates that `trip.destination` exists. If missing, uses `model.invoke()` to ask the user for it.
2. **Fetch data:** If `USE_PLACES_API=true` and `trip.hotelCoords` is set, calls `searchNearbyPlaces({ type: "selfie", ... })` which searches for tourist attractions, museums, art galleries, and zoos. Otherwise, creates 5 `SelfieSpots` templates with all fields set to `null` and passes them to `generator()`.
3. **Summarize:** If `GENERATE_SUMMARIES=true`, generates a conversational summary via a second LLM call.
4. Returns both the summary message and the structured `SelfieResponseData`.

**Response data type:**

```typescript
export interface SelfieResponseData {
  type: "selfie";
  summary?: string;
  options?: SelfieSpots[];
}
```

### Tips Agent

**Location:** `graph/nodes/tips/`

Generates travel tips using the generator function. Unlike other agents, the tips agent is **not part of the LangGraph workflow** -- it has its own dedicated `POST /tips` endpoint that calls the generator directly without going through intent classification or routing.

**Files:**

- `tipsNode.ts` - Tips generation function

**How it works:**

1. Receives a `TipsRequest` via `POST /tips` with a Trip that includes a `destination`.
2. Creates a single `Tips` template with `id` pre-filled (via `nanoid()`) and all tip fields set to `null`.
3. Passes the template and Trip context (including travel dates) to the `generator()` function, which fills in each tip field with 2-4 sentences.
4. Returns a `TipsResponse` with the generated tips in the `data` field.

**Tip categories:**

- **transportTips**: Useful transportation tips for visitors at the destination.
- **whenToVisitTips**: Best times to visit, crowd avoidance, upcoming holidays and festivals.
- **safetyTips**: Tips for avoiding dangerous areas and staying safe during the trip.

**Response data type:**

```typescript
export interface TipsResponseData {
  type: "tips";
  summary?: string;
  options?: Tips[];
}
```

### Unsupported Node

**Location:** `graph/nodes/unsupportedNode.ts`

Simple fallback handler that returns a friendly message when the user's request doesn't match any supported intent.

## Generator Function

**Location:** `utils/agents/generator.ts`

A generic utility that calls an LLM to fill `null` values in JSON data with contextually appropriate values. Used as a primary data source (tips agent) or as a fallback when the Google Places API is disabled or coordinates are unavailable.

### Function Signature

```typescript
export async function generator<T extends object>(
  options: GeneratorOptions<T>,
): Promise<T[]>;
```

### GeneratorOptions

| Field         | Type                      | Description                                                      |
| ------------- | ------------------------- | ---------------------------------------------------------------- |
| `data`        | `T \| T[]`                | Template(s) with null values to fill. Non-null values preserved. |
| `context`     | `Record<string, unknown>` | Contextual information for realistic generation.                 |
| `description` | `string`                  | Natural language description of what data to generate.           |

### Behavior

1. Normalizes input to an array.
2. Scans for null fields and lists them in the LLM prompt.
3. Calls `model.invoke()` with system + human messages using the `smart` model tier.
4. Parses JSON response (with markdown code fence fallback).
5. Defensively preserves non-null values from the original template.
6. Always returns `T[]`.

### Use Cases

- **All fields null (placeholder data):** When `USE_PLACES_API=false` or coordinates are unavailable, agents create templates where every field is null and the generator fills all of them based on Trip context.
- **Partial null fields (supplementing API data):** An agent fetches data from an API but some fields come back as null. The generator fills only the missing fields while preserving existing data.

## Tools

Tools are functions that agents can invoke to perform specific actions. They are defined using LangChain's `tool()` function with Zod schema validation.

### Tool Definition Pattern

Tools are stored in the `tools/` folder and imported into agent-specific `tools.ts` files:

```typescript
import { tool } from "@langchain/core/tools";
import * as z from "zod";

export const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: `
    Adds two numbers together.
    Use this ONLY when the user asks for addition
    between exactly two numeric values.
  `,
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});
```

### Tool Binding

Each agent has a `tools.ts` file that collects and exports tools:

```typescript
import { add } from "../../../tools/arithmetic/add.js";
import { subtract } from "../../../tools/arithmetic/subtract.js";
import { multiply } from "../../../tools/arithmetic/multiply.js";
import { divide } from "../../../tools/arithmetic/divide.js";

export const arithmeticToolsByName = { add, subtract, multiply, divide };
export const arithmeticTools = Object.values(arithmeticToolsByName);
```

### Available Tools

| Tool                  | Location                              | Agent      | Description                                                        |
| --------------------- | ------------------------------------- | ---------- | ------------------------------------------------------------------ |
| `add`                 | `tools/arithmetic/add.ts`             | Arithmetic | Adds two numbers                                                   |
| `subtract`            | `tools/arithmetic/subtract.ts`        | Arithmetic | Subtracts two numbers                                              |
| `multiply`            | `tools/arithmetic/multiply.ts`        | Arithmetic | Multiplies two numbers                                             |
| `divide`              | `tools/arithmetic/divide.ts`          | Arithmetic | Divides two numbers                                                |
| `searchFlights`       | `tools/travel/searchFlights.ts`       | Flight     | Searches Amadeus API for round-trip flights                        |
| `validateAirport`     | `tools/travel/validateAirport.ts`     | Flight     | Validates IATA airport codes against `airports.json`; returns name and coordinates |
| `searchNearbyPlaces`  | `tools/travel/searchNearbyPlaces.ts`  | Hotel, Restaurant, Activities, Nature, Selfie | Calls Google Places API within a 10km radius; returns typed results per category |

### searchNearbyPlaces

**Location:** `tools/travel/searchNearbyPlaces.ts`

Calls the Google Places API (`places:searchNearby`) and returns typed results shaped to the appropriate domain type. Requires `GOOGLE_PLACES_API_KEY` in the environment.

```typescript
await searchNearbyPlaces({
  type: "activities",   // "hotel" | "restaurant" | "activities" | "nature" | "selfie"
  latitude: 35.6892,
  longitude: 139.6922,
});
// Returns Activities[] with id, name, location, description, website
```

Each `type` maps to a different set of `includedTypes` in the Places API request:

| type          | includedTypes                                              |
| ------------- | ---------------------------------------------------------- |
| `hotel`       | hotel                                                      |
| `restaurant`  | restaurant, fast_food_restaurant, cafe, food_court         |
| `activities`  | tourist_attraction, amusement_park, museum, art_gallery, zoo |
| `nature`      | park, national_park, campground, hiking_area               |
| `selfie`      | tourist_attraction, museum, art_gallery, zoo               |

### validateAirport

**Location:** `tools/travel/validateAirport.ts`

Validates an IATA airport code against the local `data/airports/airports.json` lookup table and returns the airport's full name and geographic coordinates. Used by the flight agent to resolve airports and populate `trip.destinationCoords`.

```typescript
// Returns: { name, iata_code, latitude_deg, longitude_deg }
await validateAirportCode("JFK");
```

## Types & Data Flow

### Message Types

**Location:** `types/api.ts`

```typescript
export interface Message {
  type: "human" | "ai";
  content: string;
}
```

### Request/Response

```typescript
export interface ChatRequest {
  messages: Message[];
  data?: ResponseData | null;
  trip: Trip;
}

export interface ChatResponse {
  messages: Message[];
  data: ResponseData | null;
  trip: Trip;
}

export interface TipsRequest {
  data?: ResponseData | null;
  trip: Trip;
}

export interface TipsResponse {
  data: ResponseData | null;
  trip: Trip;
}
```

### Response Data

The `ResponseData` type is a discriminated union that supports different agent response types:

```typescript
export type ResponseData =
  | ArithmeticResponseData
  | FlightResponseData
  | HotelResponseData
  | RestaurantResponseData
  | ActivitiesResponseData
  | NatureResponseData
  | SelfieResponseData
  | TipsResponseData;
```

### Trip State

**Location:** `types/trip.ts`

```typescript
export interface Trip {
  origin: string | null;
  destination: string | null;
  departureFlight: string | null;
  returnFlight: string | null;
  departureDate: string | null;
  returnDate: string | null;
  budget: number | null;
  hotel: string | null;
  interests: string[];
  constraints: string[];
  destinationCoords: { latitude: number; longitude: number } | null;
  hotelCoords: { latitude: number; longitude: number } | null;
}
```

| Field              | Type                                          | Purpose                                                               |
| ------------------ | --------------------------------------------- | --------------------------------------------------------------------- |
| `origin`           | `string \| null`                              | Trip origin city or airport code                                      |
| `destination`      | `string \| null`                              | Trip destination city or airport code                                 |
| `departureFlight`  | `string \| null`                              | Selected departure flight identifier                                  |
| `returnFlight`     | `string \| null`                              | Selected return flight identifier                                     |
| `departureDate`    | `string \| null`                              | Departure date (YYYY-MM-DD)                                           |
| `returnDate`       | `string \| null`                              | Return date (YYYY-MM-DD)                                              |
| `budget`           | `number \| null`                              | Trip budget in USD                                                    |
| `hotel`            | `string \| null`                              | Hotel name selected by the user                                       |
| `interests`        | `string[]`                                    | User interests for personalized recommendations                       |
| `constraints`      | `string[]`                                    | User constraints (dietary restrictions, accessibility needs, etc.)    |
| `destinationCoords`| `{ latitude: number; longitude: number } \| null` | Coordinates of the destination airport; populated by `validateAirport` and used for hotel `searchNearbyPlaces` calls |
| `hotelCoords`      | `{ latitude: number; longitude: number } \| null` | Coordinates of the chosen hotel; used for restaurant, activities, nature, and selfie `searchNearbyPlaces` calls |

### Intent Types

**Location:** `types/intents.ts`

```typescript
export type Intent =
  | "activities"
  | "arithmetic"
  | "flights"
  | "hotel"
  | "nature"
  | "restaurant"
  | "selfie"
  | "unsupported";
```

### Tips Types

**Location:** `types/tips/tips.ts`

```typescript
export interface Tips {
  id: string;
  transportTips: string;
  whenToVisitTips: string;
  safetyTips: string;
}
```

### Restaurant Types

**Location:** `types/restaurant/restaurants.ts`

```typescript
export interface RestaurantResults {
  name: string;
  location: string;
  cuisine: string;
}
```

### Selfie Types

**Location:** `types/selfie/selfieSpots.ts`

```typescript
export interface SelfieSpots {
  id: string;
  name: string;
  location: string;
  description: string;
  website: string;
}
```

## API Server

**Location:** `index.ts`

The application runs an Express server with the following endpoints:

### Endpoints

| Method | Path      | Description                                    |
| ------ | --------- | ---------------------------------------------- |
| GET    | `/health` | Health check endpoint                          |
| POST   | `/chat`   | Main chat endpoint (graph-based intent routing) |
| POST   | `/tips`   | Travel tips endpoint (standalone, generator-based) |

### Chat Endpoint

**Request:**

```json
{
  "messages": [
    { "type": "human", "content": "Find flights from LAX to JFK" }
  ],
  "trip": {
    "origin": null,
    "destination": null,
    "destinationCoords": null,
    "hotelCoords": null,
    ...
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

### Message Processing

1. Frontend messages are converted to LangChain `BaseMessage` objects
2. Graph is invoked with messages, trip context, and previous data
3. Tool messages are filtered out before returning to client
4. Empty AI messages are removed from the response

## Model Support

Model selection is driven entirely by environment variables using the `loadModel()` function. No code changes are needed to switch LLMs.

### loadModel Function

**Location:** `utils/agents/loadModel.ts`

```typescript
export type ModelTier = "fast" | "standard" | "smart";

export function loadModel(tier: ModelTier): BaseChatModel;
```

Reads `[TIER]_MODEL_COMPANY` and `[TIER]_MODEL_NAME` from the environment and returns the appropriate LLM instance.

### Model Tiers

| Tier       | Used by                                            | Env vars                                        |
| ---------- | -------------------------------------------------- | ----------------------------------------------- |
| `fast`     | `classifyIntent` (routing / classification)        | `FAST_MODEL_COMPANY`, `FAST_MODEL_NAME`         |
| `standard` | `arithmeticNode`, `summarizeFlights`               | `STANDARD_MODEL_COMPANY`, `STANDARD_MODEL_NAME` |
| `smart`    | All travel-planning nodes + `generator()`          | `SMART_MODEL_COMPANY`, `SMART_MODEL_NAME`       |

### Supported Providers

| `MODEL_COMPANY` value | Provider       | Notes                              |
| --------------------- | -------------- | ---------------------------------- |
| `OpenAI`              | OpenAI GPT     | `temperature: 1`, `maxRetries: 2`  |
| `GoogleGemini`        | Google Gemini  | `temperature: 0`                   |
| `Ollama`              | Local Ollama   | `temperature: 0`                   |

### Example Configuration

```bash
FAST_MODEL_COMPANY=Ollama
FAST_MODEL_NAME=qwen2.5:3b
STANDARD_MODEL_COMPANY=OpenAI
STANDARD_MODEL_NAME=gpt-4o-mini
SMART_MODEL_COMPANY=OpenAI
SMART_MODEL_NAME=gpt-5-nano
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
│       ├── arithmetic/
│       │   ├── arithmeticNode.ts
│       │   └── tools.ts
│       ├── flight/
│       │   ├── flightNode.ts
│       │   ├── tools.ts
│       │   └── utils/
│       │       └── summarizeFlights.ts
│       ├── hotel/
│       │   └── hotelNode.ts
│       ├── restaurant/
│       │   └── restaurantNode.ts
│       ├── activities/
│       │   └── activityNode.ts
│       ├── nature/
│       │   └── natureNode.ts
│       ├── selfie/
│       │   └── selfieNode.ts
│       ├── tips/
│       │   └── tipsNode.ts
│       ├── supervisor/
│       │   ├── router.ts
│       │   └── utils/
│       │       └── classifyIntent.ts
│       └── unsupportedNode.ts
├── models/
│   ├── gemini.ts
│   ├── ollama.ts
│   └── openAi.ts
├── tools/
│   ├── arithmetic/
│   │   ├── add.ts
│   │   ├── subtract.ts
│   │   ├── multiply.ts
│   │   └── divide.ts
│   └── travel/
│       ├── searchFlights.ts
│       ├── searchNearbyPlaces.ts  # Google Places API integration
│       └── validateAirport.ts    # IATA code validation + coords lookup
├── types/
│   ├── api.ts
│   ├── intents.ts
│   ├── trip.ts
│   ├── arithmetic/
│   │   └── arithmetic.ts
│   ├── activities/
│   │   └── activities.ts
│   ├── flight/
│   │   └── flights.ts
│   ├── hotel/
│   │   └── hotels.ts
│   ├── nature/
│   │   └── nature.ts
│   ├── restaurant/
│   │   └── restaurants.ts
│   ├── selfie/
│   │   └── selfieSpots.ts
│   └── tips/
│       └── tips.ts
├── utils/
│   ├── agents/
│   │   ├── extractLastToolJson.ts
│   │   ├── generator.ts
│   │   └── loadModel.ts          # Dynamic model loader
│   └── amadeus/
│       └── tokenManager.ts
├── docs/
│   └── APP-CONTEXT.md
└── index.ts                  # Express server
```

## Environment Variables

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
