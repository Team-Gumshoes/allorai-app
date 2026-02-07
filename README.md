# Trip Planning Multi-Agent Server

An Express server that uses LangChain's LangGraph to build AI agents with a supervisor pattern. A supervisor agent analyzes user intent and routes requests to specialized agents that can answer questions using their own tools.

## Features

- **Multi-Agent Architecture**: Supervisor pattern with intent-based routing
- **Arithmetic Agent**: Basic math operations (+, -, \*, /) between two numbers
- **Flight Agent**: Search for round-trip flights using the Amadeus API
- **Multiple LLM Support**: OpenAI, Google Gemini, or local Ollama models
- **Extensible**: Easy to add new agents with custom tools

## Architecture

```
START → Router → [Arithmetic Agent | Flight Agent | Unsupported] → END
```

The router classifies user intent and directs the request to the appropriate agent. Each agent has access to domain-specific tools and can engage in multi-turn conversations to gather required information.

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

### Adding a New Agent

Follow these steps to add a new agent to the system:

#### 1. Add Intent Type

Update `types/intents.ts`:

```typescript
export type Intent = "arithmetic" | "flights" | "hotels" | "unsupported";
```

#### 2. Update Intent Classifier

Modify the system prompt in `graph/nodes/supervisor/utils/classifyIntent.ts` to include the new intent category and classification rules.

#### 3. Add Routing Case

Update `graph/nodes/supervisor/router.ts`:

```typescript
export function routeByIntent(state: AgentStateType): string {
  switch (state.intent) {
    case "arithmetic":
      return "arithmeticAgent";
    case "flights":
      return "flightAgent";
    case "hotels":
      return "hotelAgent"; // New case
    default:
      return "unsupportedNode";
  }
}
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
// tools/hotel/searchHotels.ts
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
  | HotelResponseData;
```

#### 7. Wire Into Graph

Update `graph/index.ts`:

```typescript
import { hotelNode } from "./nodes/hotel/hotelNode.js";

const workflow = new StateGraph(AgentState)
  .addNode("router", routerNode)
  .addNode("arithmeticAgent", arithmeticNode)
  .addNode("flightAgent", flightNode)
  .addNode("hotelAgent", hotelNode) // New node
  .addNode("unsupportedNode", unsupportedNode)
  .addEdge(START, "router")
  .addConditionalEdges("router", routeByIntent)
  .addEdge("arithmeticAgent", END)
  .addEdge("flightAgent", END)
  .addEdge("hotelAgent", END) // New edge
  .addEdge("unsupportedNode", END);
```

## Project Structure

```
multi-agent-example/
├── graph/
│   ├── index.ts              # Graph definition
│   ├── state.ts              # State annotation
│   └── nodes/
│       ├── arithmetic/       # Arithmetic agent
│       ├── flight/           # Flight agent
│       ├── supervisor/       # Router and intent classification
│       └── unsupportedNode.ts
├── models/                   # LLM configurations
├── tools/                    # Tool implementations
├── types/                    # TypeScript types
├── docs/
│   └── APP-CONTEXT.md        # Technical documentation
└── index.ts                  # Express server
```

## Learning Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [LangChain.js Documentation](https://js.langchain.com/docs/)
