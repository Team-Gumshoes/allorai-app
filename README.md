# AllorAI - AI-Powered Travel Planning Platform

AllorAI is a comprehensive travel planning system powered by AI agents that help users plan their perfect trip. The platform uses a multi-agent architecture where specialized agents handle different aspects of travel planning (flights, hotels, transportation, etc.) and a coordinator agent orchestrates them to provide comprehensive travel solutions.

## Key Features

- **Multi-Agent Architecture**: Specialized AI agents for flights, hotels, transportation, and trip coordination
- **Hybrid Language Support**: Mix of TypeScript and Python agents communicating via HTTP
- **Flexible Coordinator**: Choose between Python (with LangGraph) or TypeScript coordinator agents
- **Mock Mode**: Develop without API keys using realistic mock data
- **Monorepo Structure**: All code organized in a single repository with shared packages
- **Docker-First**: Complete Docker setup for easy local development
- **Hot Reloading**: Instant code changes reflection for rapid development

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
│                    (React + Vite - Port 5173)                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ HTTP
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Port 3001)                    │
│                      (Express + TypeScript)                     │
│                     Routes requests to agents                   │
└─────────────────┬───────────────────────────────┬───────────────┘
                  │                               │
        ┌─────────▼──────────┐         ┌──────────▼───────────────┐
        │  TypeScript Agents │         │   Python Agents          │
        │    (Port 3002)     │◄────────┤    (Port 8000)           │
        │                    │  HTTP   │                          │
        │  - Flight Agent    │         │ - Hotel Agent            │
        │  - Coordinator*    │         │ - Transport Agent        │
        │    (Optional)      │         │ - Coordinator* (Default) │
        └────────────────────┘         └──────────────────────────┘
                 │                                 │
                 │                                 │
                 ▼                                 ▼
            External APIs                     External APIs
           (Amadeus, etc.)                    (Various APIs)
```

## Technology Stack

### Frontend

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS

### Backend - TypeScript Services

- **Express** - Web framework
- **TypeScript** - Type safety
- **LangChain** - AI agent framework
- **Axios** - HTTP client

### Backend - Python Services

- **FastAPI** - Modern Python web framework
- **LangChain** - AI agent framework
- **LangGraph** - Agent workflow orchestration
- **httpx** - Async HTTP client

### Infrastructure

- **pnpm** - Fast, disk space efficient package manager
- **Turborepo** - Monorepo build system
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## Project Structure

```
allorai/
├── apps/
│   ├── web/                    # React frontend (Port 5173)
│   ├── api-gateway/            # Express API gateway (Port 3001)
│   ├── typescript-agents/      # TypeScript agents (Port 3002)
│   └── python-agents/          # Python agents (Port 8000)
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── ui-components/          # Shared React components
│   └── utils/                  # Shared utilities
├── docker-compose.yml          # Docker orchestration
├── pnpm-workspace.yaml         # pnpm workspace config
├── turbo.json                  # Turborepo config
├── tsconfig.base.json          # Base TypeScript config
└── README.md                   # This file
```

## Quick Links

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Comprehensive developer guide

## Team Collaboration Workflows

### Scenario 1: Alice (Frontend Developer)

Alice is working on the UI and only needs to run the frontend and API gateway:

```bash
# Start only the services Alice needs
docker-compose up web api-gateway typescript-agents python-agents

# Or start everything (recommended for first-time setup)
docker-compose up
```

Alice can now work on files in `apps/web/` and see changes instantly with hot reloading.

### Scenario 2: Bob (Python Agent Developer)

Bob is adding a new hotel search feature in Python:

```bash
# Start the Python agents service
docker-compose up python-agents

# In another terminal, Bob can test the agent directly
curl -X POST http://localhost:8000/hotel/search \
  -H "Content-Type: application/json" \
  -d '{"city": "Paris", "checkIn": "2024-06-01", "checkOut": "2024-06-05"}'
```

### Scenario 3: Charlie (TypeScript Agent Developer)

Charlie is improving the flight search agent:

```bash
# Start TypeScript agents service
docker-compose up typescript-agents

# Test the flight agent
curl -X POST http://localhost:3002/flight/search \
  -H "Content-Type: application/json" \
  -d '{"origin": "JFK", "destination": "LAX", "date": "2024-06-01"}'
```

### Scenario 4: Full Team Development

The whole team is working together:

```bash
# Start all services
docker-compose up

# Each team member works on their respective folders:
# - Frontend team: apps/web/
# - API team: apps/api-gateway/
# - TS agents team: apps/typescript-agents/
# - Python agents team: apps/python-agents/
```

## Docker Workflow Examples

### Run Everything (Recommended for First Time)

```bash
docker-compose up --build
```

### Run Only Frontend + API

```bash
docker-compose up web api-gateway typescript-agents python-agents
```

### Run Only Python Agents (For Agent Development)

```bash
docker-compose up python-agents
```

### Run Only TypeScript Agents (For Agent Development)

```bash
docker-compose up typescript-agents
```

### View Logs for Specific Service

```bash
docker-compose logs -f web           # Frontend logs
docker-compose logs -f api-gateway   # API Gateway logs
docker-compose logs -f typescript-agents  # TS agents logs
docker-compose logs -f python-agents # Python agents logs
```

### Rebuild After Dependency Changes

```bash
docker-compose up --build
```

### Stop All Services

```bash
docker-compose down
```

## Agent Communication Flow

```
User Request
     │
     ▼
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│   Coordinator    │  ◄─── Default: Python (LangGraph)
│     Agent        │       Optional: TypeScript
└────────┬─────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    ▼         ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Flight │ │ Hotel  │ │Transport│ │  ...   │
│ Agent  │ │ Agent  │ │ Agent  │ │        │
└────────┘ └────────┘ └────────┘ └────────┘
    │         │         │          │
    └─────────┴─────────┴──────────┘
              │
              ▼
       Aggregated Results
              │
              ▼
           Frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test locally: `docker-compose up --build`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Development Setup

See [QUICKSTART.md](./QUICKSTART.md) for getting started quickly, or [DEVELOPMENT.md](./DEVELOPMENT.md) for comprehensive development guide.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

- Open an issue on GitHub
- Check [DEVELOPMENT.md](./DEVELOPMENT.md) for common issues and solutions
