# Architecture

## Overview

AllorAI uses a **supervisor pattern** built on LangGraph's `StateGraph`. Every `/chat` request passes through a router that classifies intent, then delegates to one of several specialized agent nodes.

```
START → Router → [Flight | Hotel | Restaurant | Activities | Nature | Selfie | Arithmetic | Unsupported] → END
```

## Graph Definition

Defined in `graph/index.ts`:

```typescript
const workflow = new StateGraph(AgentState)
  .addNode("router", routerNode)
  .addNode("flightAgent", flightNode)
  .addNode("hotelAgent", hotelNode)
  // ... other agents
  .addEdge(START, "router")
  .addConditionalEdges("router", routeByIntent)
  .addEdge("flightAgent", END);
// ... other edges

export const graph = workflow.compile();
```

## State

Defined in `graph/state.ts`, extending LangChain's `MessagesAnnotation`:

| Field      | Type                   | Purpose                                           |
| ---------- | ---------------------- | ------------------------------------------------- |
| `messages` | `BaseMessage[]`        | Conversation message history                      |
| `intent`   | `Intent \| null`       | Classified intent used for routing                |
| `trip`     | `Trip`                 | Full trip context (destination, dates, budget...) |
| `data`     | `ResponseData \| null` | Structured output from the last agent             |

## Agent Patterns

There are three patterns used across agents:

| Pattern                    | How data is produced                                     | Used by                                       |
| -------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| **Tool-based**             | `createReactAgent` calls LangChain tools (external APIs) | Arithmetic, Flight                            |
| **Places API + Generator** | Google Places API with LLM generator fallback            | Hotel, Restaurant, Activities, Nature, Selfie |
| **Generator-only**         | LLM fills a null-field template directly                 | Tips                                          |

## Intent Classification

The router (`graph/nodes/supervisor/`) uses a lightweight LLM call (`fast` model tier) to classify the last 6 messages into one of 8 intents:

`arithmetic` | `flights` | `hotel` | `restaurant` | `activities` | `nature` | `selfie` | `unsupported`

The router handles follow-up messages correctly — if the user is mid-conversation about flights and asks a clarifying question, the intent stays as `flights`.

## Generator Utility

`utils/agents/generator.ts` is a generic utility used across agents. It takes a template object (with `null` fields), a context object, and a description, then calls the `smart` model to fill in the nulls. Non-null values are always preserved.

This is used as:

- A **primary data source** when APIs are disabled or coordinates are unavailable
- A **fallback** to fill missing fields from API responses
