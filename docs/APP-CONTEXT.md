# Trip Planning Multi-Agent Application

A trip planning application built with LangChain's LangGraph technology, implementing a supervisor pattern with multiple specialized AI agents.

## Architecture Overview

This application uses a **supervisor pattern** where a central supervisor agent analyzes user intent and routes requests to specialized agents. Each agent operates as a separate node in the graph with access to domain-specific tools.

```
START → Router → [Arithmetic Agent | Flight Agent | Unsupported Node] → END
```

### Current Agents

| Agent       | Purpose                                                 | Tools                           |
| ----------- | ------------------------------------------------------- | ------------------------------- |
| Arithmetic  | Basic math operations (+, -, \*, /) between two numbers | add, subtract, multiply, divide |
| Flight      | Flight search using Amadeus API                         | searchFlights                   |
| Unsupported | Fallback for unrecognized requests                      | None                            |

## Graph Structure

The graph is defined in `graph/index.ts` using LangGraph's `StateGraph`:

```typescript
const workflow = new StateGraph(AgentState)
  .addNode("router", routerNode)
  .addNode("arithmeticAgent", arithmeticNode)
  .addNode("flightAgent", flightNode)
  .addNode("unsupportedNode", unsupportedNode)
  .addEdge(START, "router")
  .addConditionalEdges("router", routeByIntent)
  .addEdge("arithmeticAgent", END)
  .addEdge("flightAgent", END)
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
| `data`     | `ResponseData \| null` | Extracted data from tool calls                           |

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
- Returns one of: `arithmetic`, `flights`, or `unsupported`

```typescript
export function routeByIntent(state: AgentStateType): string {
  switch (state.intent) {
    case "arithmetic":
      return "arithmeticAgent";
    case "flights":
      return "flightAgent";
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

Searches for round-trip flights using the Amadeus API.

**Files:**

- `flightNode.ts` - Agent node with dynamic system prompt
- `tools.ts` - Tool bindings
- `utils/summarizeFlights.ts` - LLM-based flight summarization

**Tools:**

- `searchFlights` - Searches Amadeus API for round-trip flights

**Dynamic System Prompt:**
The flight agent builds a context-aware system prompt that includes current trip details and missing required fields:

- Origin city/airport
- Destination city/airport
- Departure date
- Return date

**Post-Processing:**
After fetching flight data, the agent uses `summarizeFlights()` to generate a human-readable summary using a separate LLM call (Gemini model).

### Unsupported Node

**Location:** `graph/nodes/unsupportedNode.ts`

Simple fallback handler that returns a friendly message when the user's request doesn't match any supported intent.

## Tools

Tools are functions that agents can invoke to perform specific actions. They are defined using LangChain's `tool()` function with Zod schema validation.

### Tool Definition Pattern

Tools are stored in the `tools/` folder and imported into agent-specific `tools.ts` files:

```typescript
// tools/arithmetic/add.ts
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
// graph/nodes/arithmetic/tools.ts
import { add } from "../../../tools/arithmetic/add.js";
import { subtract } from "../../../tools/arithmetic/subtract.js";
import { multiply } from "../../../tools/arithmetic/multiply.js";
import { divide } from "../../../tools/arithmetic/divide.js";

export const arithmeticToolsByName = { add, subtract, multiply, divide };
export const arithmeticTools = Object.values(arithmeticToolsByName);
```

### Available Tools

| Tool            | Location                        | Agent      | Description                      |
| --------------- | ------------------------------- | ---------- | -------------------------------- |
| `add`           | `tools/arithmetic/add.ts`       | Arithmetic | Adds two numbers                 |
| `subtract`      | `tools/arithmetic/subtract.ts`  | Arithmetic | Subtracts two numbers            |
| `multiply`      | `tools/arithmetic/multiply.ts`  | Arithmetic | Multiplies two numbers           |
| `divide`        | `tools/arithmetic/divide.ts`    | Arithmetic | Divides two numbers              |
| `searchFlights` | `tools/travel/searchFlights.ts` | Flight     | Searches Amadeus API for flights |

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
  debug: Message[];
}
```

### Response Data

The `ResponseData` type is a discriminated union that supports different agent response types:

```typescript
export type ResponseData = ArithmeticResponseData | FlightResponseData;

export interface ArithmeticResponseData {
  type: "arithmetic";
  summary?: string;
  options?: ArithmeticResult;
}

export interface FlightResponseData {
  type: "flight";
  summary?: string;
  options?: FlightResults[];
}
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
}
```

### Intent Types

**Location:** `types/intents.ts`

```typescript
export type Intent = "arithmetic" | "flights" | "unsupported";
```

## API Server

**Location:** `index.ts`

The application runs an Express server with the following endpoints:

### Endpoints

| Method | Path      | Description           |
| ------ | --------- | --------------------- |
| GET    | `/health` | Health check endpoint |
| POST   | `/chat`   | Main chat endpoint    |

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
  "debug": [ ... ]
}
```

### Message Processing

1. Frontend messages are converted to LangChain `BaseMessage` objects
2. Graph is invoked with messages, trip context, and previous data
3. Tool messages are filtered out before returning to client
4. Empty AI messages are removed from the response

## Model Support

The application supports multiple LLM backends, configured in the `models/` folder.

### Available Models

| Model          | File               | Configuration                    |
| -------------- | ------------------ | -------------------------------- |
| OpenAI GPT     | `models/openAi.ts` | gpt-5-nano, temperature: 1       |
| Google Gemini  | `models/gemini.ts` | gemini-2.5-flash, temperature: 0 |
| Ollama (Local) | `models/ollama.ts` | qwen2.5:3b, temperature: 0       |

### Switching Models

To switch models, update the import statement in the agent file:

```typescript
// Use OpenAI (default)
import { model } from "../../../models/openAi.js";

// Use Gemini
import { model } from "../../../models/gemini.js";

// Use Ollama (local)
import { model } from "../../../models/ollama.js";
```

### Configuration Examples

**OpenAI:**

```typescript
export const model = new ChatOpenAI({
  model: "gpt-5-nano",
  temperature: 1,
  maxRetries: 2,
});
```

**Gemini:**

```typescript
export const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
});
```

## Project Structure

```
multi-agent-example/
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
│       └── searchFlights.ts
├── types/
│   ├── api.ts
│   ├── intents.ts
│   ├── trip.ts
│   ├── arithmetic/
│   │   └── arithmetic.ts
│   └── flight/
│       └── flights.ts
├── utils/
│   └── agents/
│       └── extractLastToolJson.ts
└── index.ts                  # Express server
```

## Environment Variables

| Variable            | Description                           |
| ------------------- | ------------------------------------- |
| `PORT`              | Server port (default: 8000)           |
| `OPENAI_API_KEY`    | OpenAI API key                        |
| `GOOGLE_API_KEY`    | Google Gemini API key                 |
| `AMADEUS_API_TOKEN` | Amadeus API token for flight searches |
