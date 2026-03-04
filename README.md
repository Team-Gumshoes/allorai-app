# AllorAI — Travel Planning Multi-Agent Server

An Express/Node.js server that uses [LangGraph](https://langchain-ai.github.io/langgraphjs/) to orchestrate a set of specialized AI agents for trip planning. A supervisor agent classifies user intent and routes each request to the right agent — for flights, hotels, restaurants, activities, nature spots, or selfie locations.

## Features

- **Supervisor pattern** — intent classification routes requests to the correct agent
- **Flight search** — real flight data via the Amadeus API (or LLM-generated fallback)
- **Place recommendations** — hotels, restaurants, activities, nature spots, selfie spots via Google Places API
- **Travel tips** — transport, safety, and best-time-to-visit tips enriched with Wikipedia data
- **Flexible LLM support** — swap between OpenAI, Google Gemini, and local Ollama models via env vars, no code changes needed
- **LLM fallback** — all agents degrade gracefully to LLM-generated data when APIs are disabled

## Installation

Requires [pnpm](https://pnpm.io/).

```bash
pnpm install
cp .env.example .env   # fill in your API keys and model config
```

## Running

```bash
pnpm run dev     # development with hot reload
pnpm run start   # production
```

The server starts on `http://localhost:8000` (or your configured `PORT`).

## API

| Method | Path      | Description                                     |
| ------ | --------- | ----------------------------------------------- |
| POST   | `/chat`   | Send a message; routed to the appropriate agent |
| POST   | `/tips`   | Generate travel tips for a destination          |
| GET    | `/health` | Health check                                    |

See [docs/api.md](docs/api.md) for full request/response examples.

## Documentation

| File                                         | Description                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md) | Supervisor pattern, LangGraph graph, agent patterns, state |
| [docs/agents.md](docs/agents.md)             | Each agent: purpose, pattern, and behavior                 |
| [docs/api.md](docs/api.md)                   | Endpoint reference with request/response examples          |
| [docs/models.md](docs/models.md)             | LLM tiers, supported providers, environment config         |
| [docs/integrations.md](docs/integrations.md) | Amadeus, Google Places, and Wikipedia integrations         |
| [docs/data-model.md](docs/data-model.md)     | Trip state, TypeScript types, response shapes              |
| [docs/extending.md](docs/extending.md)       | How to add new agents and tools                            |
| [docs/roadmap.md](docs/roadmap.md)           | Planned improvements                                       |

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Agents**: LangChain / LangGraph
- **External APIs**: Amadeus (flights), Google Places (venues), Wikipedia (tips + city coords)
- **LLM Providers**: OpenAI, Google Gemini, Ollama
