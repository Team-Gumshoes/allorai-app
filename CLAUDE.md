# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AllorAI is an AI-powered travel planning platform using a multi-agent architecture. It's a monorepo with TypeScript and Python services that communicate via HTTP.

## Build & Development Commands

### Docker (Primary Development Method)

```bash
docker compose up --build      # Start all services with rebuild
docker compose up -d           # Start in background
docker compose logs -f web     # View logs for specific service
docker compose down            # Stop all services
docker compose exec web sh     # Shell into Node container
docker compose exec python-agents bash  # Shell into Python container
```

### pnpm Workspace Commands

```bash
pnpm install                              # Install all dependencies
pnpm dev                                  # Start all services (via NX)
pnpm build                                # Build all packages
pnpm lint                                 # Lint all code
pnpm --filter @allorai/web add <pkg>      # Add package to specific workspace
pnpm --filter @allorai/web dev            # Run dev for specific app
```

### App-Specific Commands

**Frontend (apps/web/)**
```bash
pnpm --filter @allorai/web dev      # Rsbuild dev server on :5173
pnpm --filter @allorai/web build    # Production build
pnpm --filter @allorai/web lint     # ESLint
```

**API Gateway (apps/api-gateway/)**
```bash
pnpm --filter @allorai/api-gateway dev    # tsx watch on :3001
pnpm --filter @allorai/api-gateway build  # TypeScript compile
```

**TypeScript Agents (apps/typescript-agents/)**
```bash
pnpm --filter @allorai/typescript-agents dev    # tsx watch on :3002
pnpm --filter @allorai/typescript-agents build  # TypeScript compile
```

**Python Agents (apps/python-agents/)**
```bash
cd apps/python-agents
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### NX Commands

```bash
nx graph                        # View project dependency graph
nx affected --target=build      # Build only affected projects
nx reset                        # Clear NX cache
```

## Architecture

### Service Communication Flow

```
Browser → Frontend (:5173) → API Gateway (:3001) → Coordinator Agent
                                                         ↓
                                    ┌────────────────────┼────────────────────┐
                                    ↓                    ↓                    ↓
                             Flight Agent         Hotel Agent         Transport Agent
                            (TS :3002)           (Python :8000)      (Python :8000)
```

### Directory Structure

- **apps/web/** - React frontend with Rsbuild, TailwindCSS v4, Zustand
- **apps/api-gateway/** - Express router that proxies to agent services
- **apps/typescript-agents/** - LangChain-based flight agent + optional coordinator
- **apps/python-agents/** - FastAPI with LangGraph coordinator, hotel/transport agents
- **packages/types/** - Shared TypeScript type definitions
- **packages/ui-components/** - Shared React components (Button, Card, SearchBar, etc.)
- **packages/utils/** - Shared utility functions (formatting, validation, API helpers)

### Workspace Package References

All packages use `workspace:*` protocol:
```typescript
import type { Flight } from '@allorai/types';
import { Button } from '@allorai/ui-components';
import { formatDate } from '@allorai/utils';
```

### Agent Pattern

Agents are organized by folder with consistent structure:
- `agent.ts/py` - Main agent logic with LangChain/LangGraph
- `tools.ts/py` - Tool definitions for the agent
- `prompts.ts/py` - System prompts
- `routes.ts/py` - HTTP endpoints
- `services/` - External API integrations

## Key Configuration Files

| File | Purpose |
|------|---------|
| `nx.json` | NX build orchestration, task caching |
| `pnpm-workspace.yaml` | Defines workspace packages |
| `tsconfig.base.json` | Base TypeScript config with path aliases |
| `docker-compose.yml` | Multi-service orchestration |
| `apps/web/rsbuild.config.ts` | Frontend build config with aliases |

## Environment Variables

Key variables in `.env`:
- `USE_MOCK_RESPONSES=true` - Enable mock mode (no real API keys needed)
- `OPENAI_API_KEY` - For LangChain agents
- `AMADEUS_API_KEY/SECRET` - For flight search
- `VITE_API_GATEWAY_URL` - Frontend API endpoint

## Important Patterns

1. **Always use pnpm, never npm** - The monorepo is configured for pnpm workspaces
2. **Use `docker compose` not `docker-compose`** - Modern Docker Compose syntax
3. **Mock mode is default** - Set `USE_MOCK_RESPONSES=false` for real APIs
4. **Python coordinator is default** - Uses LangGraph; TypeScript coordinator is optional
5. **Hot reload enabled** - All services auto-restart on file changes in Docker
