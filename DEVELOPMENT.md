# AllorAI - Development Guide

Comprehensive guide for developing, extending, and maintaining the AllorAI travel planning platform.

## Table of Contents

1. [Installing Docker](#section-1-installing-docker)
2. [Project Architecture](#section-2-project-architecture)
3. [Development Workflows](#section-3-development-workflows)
4. [Adding New Agents](#section-4-adding-new-agents)
5. [Adding Frontend Features](#section-5-adding-frontend-features)
6. [Using Shared Packages](#section-6-using-shared-packages)
7. [API Keys and Environment Variables](#section-7-api-keys-and-environment-variables)
8. [Common Issues and Solutions](#section-8-common-issues-and-solutions)
9. [Useful Commands](#section-9-useful-commands)
10. [Testing](#section-10-testing)
11. [Switching Manager/Coordinator Language](#section-11-switching-managercoordinator-language)
12. [Package Management in Docker](#section-12-package-management-in-docker)

---

## Section 1: Installing Docker

### Docker Desktop for Windows

1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Run the installer
3. Follow the installation wizard
4. Restart your computer if prompted
5. Launch Docker Desktop from Start menu
6. Wait for Docker to start (icon in system tray will be green)

**Verify installation**:
```bash
docker --version
docker compose version
```

### Docker Desktop for Mac

1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Open the `.dmg` file
3. Drag Docker to Applications folder
4. Launch Docker from Applications
5. Grant necessary permissions when prompted
6. Wait for Docker to start (whale icon in menu bar)

**Verify installation**:
```bash
docker --version
docker compose version
```

### Docker Engine for Linux (Ubuntu/Debian)

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### Docker Compose Installation (if needed separately)

Docker Desktop includes Docker Compose. On Linux, if using the plugin:
```bash
# Already installed with docker-compose-plugin above
docker compose version
```

**Note**: The modern Docker Compose is invoked as `docker compose` (without hyphen). The legacy `docker-compose` command is deprecated.

---

## Section 2: Project Architecture

### Monorepo Structure

AllorAI uses a **monorepo** managed by **pnpm workspaces** and **NX**. This means:

- All code is in a single repository
- Shared packages can be imported across apps
- Dependencies are managed efficiently
- Build system is optimized with caching via NX

```
allorai/
├── apps/                       # Application services
│   ├── web/                    # React frontend (Rsbuild)
│   ├── api-gateway/            # Express API gateway
│   ├── typescript-agents/      # TypeScript AI agents
│   └── python-agents/          # Python AI agents
├── packages/                   # Shared code
│   ├── types/                  # TypeScript type definitions
│   ├── ui-components/          # React components
│   └── utils/                  # Utility functions
├── docker-compose.yml          # Multi-service orchestration
├── pnpm-workspace.yaml         # Workspace configuration
├── nx.json                     # NX build orchestration
└── tsconfig.base.json          # Base TypeScript config
```

### How Workspace Packages Work

Workspace packages are referenced with the `workspace:*` protocol:

```json
// In apps/web/package.json
{
  "dependencies": {
    "@allorai/types": "workspace:*",
    "@allorai/ui-components": "workspace:*",
    "@allorai/utils": "workspace:*"
  }
}
```

This means:
- `@allorai/types` resolves to `../../packages/types`
- Changes to packages are immediately available to apps
- No need to publish packages to npm
- TypeScript sees the actual source code

### Agent Communication Patterns (HTTP-Based)

All agents communicate via HTTP POST requests:

```
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │
       │ POST /coordinate
       ▼
┌──────────────────┐
│   Coordinator    │
│   (Python/TS)    │
└────────┬─────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    │         │         │          │
    │ POST    │ POST    │ POST     │
    ▼         ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Flight │ │ Hotel  │ │Transport│ │  ...   │
│ Agent  │ │ Agent  │ │ Agent  │ │        │
└────────┘ └────────┘ └────────┘ └────────┘
```

**Key Points**:
- All communication is HTTP (no message queues or gRPC)
- Agents are stateless and RESTful
- Request/response uses JSON
- Agents can be in different languages (TypeScript or Python)

### Manager/Coordinator Agent Architecture

The **coordinator agent** orchestrates sub-agents:

**Default: Python Coordinator (with LangGraph)**
- Location: `apps/python-agents/agents/coordinator/`
- Uses LangGraph for workflow orchestration
- Defines state machine with nodes for each agent
- Handles conditional routing between agents
- Aggregates results from multiple agents

**Optional: TypeScript Coordinator**
- Location: `apps/typescript-agents/src/agents/coordinator/`
- Uses LangChain for agent logic
- Makes HTTP calls to sub-agents
- Simpler sequential orchestration

**How it works**:
1. Coordinator receives user query
2. Analyzes query to determine needed agents
3. Makes HTTP calls to sub-agents (parallel or sequential)
4. Aggregates responses
5. Returns comprehensive result

---

## Section 3: Development Workflows

### Working on Frontend Only

If you're developing UI features:

```bash
# Start all services (frontend needs backend)
docker compose up web api-gateway typescript-agents python-agents

# Or start everything
docker compose up
```

**Files to edit**:
- `apps/web/src/` - All frontend code
- `packages/ui-components/src/` - Shared components
- `packages/types/src/` - Type definitions

**Hot reloading**: Changes to `apps/web/` files automatically reload in browser.

**Frontend Stack**:
- **Rsbuild** - Fast Rust-based build tool (replaces Vite)
- **TailwindCSS v4** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing

### Working on Python Agents

If you're developing Python agents (hotel, transport, coordinator):

```bash
# Start only Python agents
docker compose up python-agents

# In another terminal, test directly
curl -X POST http://localhost:8000/hotel/search \
  -H "Content-Type: application/json" \
  -d '{"city": "Paris", "checkIn": "2024-06-01", "checkOut": "2024-06-05"}'
```

**Files to edit**:
- `apps/python-agents/agents/hotel/` - Hotel agent
- `apps/python-agents/agents/transport/` - Transport agent
- `apps/python-agents/agents/coordinator/` - Coordinator agent

**Hot reloading**: Python FastAPI has auto-reload enabled. Changes automatically restart the server.

### Working on TypeScript Agents

If you're developing TypeScript agents (flight, optional coordinator):

```bash
# Start only TypeScript agents
docker compose up typescript-agents

# Test directly
curl -X POST http://localhost:3002/flight/search \
  -H "Content-Type: application/json" \
  -d '{"origin": "JFK", "destination": "LAX", "date": "2024-06-01"}'
```

**Files to edit**:
- `apps/typescript-agents/src/agents/flight/` - Flight agent
- `apps/typescript-agents/src/agents/coordinator/` - Optional TS coordinator

**Hot reloading**: Changes automatically restart with nodemon/tsx.

### Working on API Gateway

If you're developing the API routing layer:

```bash
# Start API gateway and dependent services
docker compose up api-gateway typescript-agents python-agents
```

**Files to edit**:
- `apps/api-gateway/src/routes/` - API routes
- `apps/api-gateway/src/middleware/` - Middleware
- `apps/api-gateway/src/services/` - HTTP clients

**Hot reloading**: Changes automatically restart the server.

---

## Section 4: Adding New Agents

### How to Add a New TypeScript Agent

Let's add a "restaurant" agent as an example:

**Step 1: Create agent folder**
```bash
mkdir -p apps/typescript-agents/src/agents/restaurant
```

**Step 2: Create agent files**

Create `apps/typescript-agents/src/agents/restaurant/agent.ts`:
```typescript
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { searchRestaurantsTool, getRestaurantDetailsTool } from './tools';
import { RESTAURANT_SYSTEM_PROMPT } from './prompts';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const model = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0,
});

const tools = [searchRestaurantsTool, getRestaurantDetailsTool];

const prompt = ChatPromptTemplate.fromMessages([
  ['system', RESTAURANT_SYSTEM_PROMPT],
  ['human', '{input}'],
  ['placeholder', '{agent_scratchpad}'],
]);

export const createRestaurantAgent = async () => {
  const agent = await createOpenAIFunctionsAgent({
    llm: model,
    tools,
    prompt,
  });

  return new AgentExecutor({
    agent,
    tools,
  });
};
```

Create `apps/typescript-agents/src/agents/restaurant/tools.ts`:
```typescript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { searchRestaurants, getRestaurantDetails } from './services/restaurant.service';

export const searchRestaurantsTool = new DynamicStructuredTool({
  name: 'search_restaurants',
  description: 'Search for restaurants in a city',
  schema: z.object({
    city: z.string().describe('City to search in'),
    cuisine: z.string().optional().describe('Type of cuisine'),
    priceRange: z.string().optional().describe('Price range'),
  }),
  func: async ({ city, cuisine, priceRange }) => {
    const results = await searchRestaurants(city, cuisine, priceRange);
    return JSON.stringify(results);
  },
});

export const getRestaurantDetailsTool = new DynamicStructuredTool({
  name: 'get_restaurant_details',
  description: 'Get details of a specific restaurant',
  schema: z.object({
    restaurantId: z.string().describe('Restaurant ID'),
  }),
  func: async ({ restaurantId }) => {
    const details = await getRestaurantDetails(restaurantId);
    return JSON.stringify(details);
  },
});
```

Create `apps/typescript-agents/src/agents/restaurant/services/restaurant.service.ts`:
```typescript
// Mock data service - replace with real API calls
export async function searchRestaurants(
  city: string,
  cuisine?: string,
  priceRange?: string
) {
  // Check if mock mode is enabled
  if (process.env.USE_MOCK_RESPONSES === 'true') {
    return [
      {
        id: 'rest1',
        name: 'Le Bistro',
        cuisine: cuisine || 'French',
        city,
        rating: 4.5,
        priceRange: priceRange || '$$',
      },
      // More mock data...
    ];
  }

  // TODO: Add real API call here
  // const response = await axios.post('https://api.example.com/restaurants', {
  //   city, cuisine, priceRange
  // });
  // return response.data;
}

export async function getRestaurantDetails(restaurantId: string) {
  if (process.env.USE_MOCK_RESPONSES === 'true') {
    return {
      id: restaurantId,
      name: 'Le Bistro',
      description: 'Authentic French cuisine',
      // More mock data...
    };
  }

  // TODO: Add real API call here
}
```

Create `apps/typescript-agents/src/agents/restaurant/routes.ts`:
```typescript
import express from 'express';
import { createRestaurantAgent } from './agent';

export const restaurantRouter = express.Router();

restaurantRouter.post('/search', async (req, res) => {
  try {
    const { city, cuisine, priceRange } = req.body;
    const agent = await createRestaurantAgent();

    const result = await agent.invoke({
      input: `Search for restaurants in ${city}${cuisine ? ` with ${cuisine} cuisine` : ''}${priceRange ? ` in ${priceRange} price range` : ''}`,
    });

    res.json({ success: true, data: result.output });
  } catch (error) {
    console.error('Restaurant search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

Create `apps/typescript-agents/src/agents/restaurant/prompts.ts`:
```typescript
export const RESTAURANT_SYSTEM_PROMPT = `You are a restaurant recommendation agent.
Your job is to help users find the perfect restaurant based on their preferences.
Use the available tools to search for restaurants and provide detailed information.`;
```

**Step 3: Register routes in main server**

Edit `apps/typescript-agents/src/index.ts`:
```typescript
import { restaurantRouter } from './agents/restaurant/routes';

// ... existing code ...

app.use('/restaurant', restaurantRouter);
```

**Step 4: Test the new agent**
```bash
# Rebuild and start
docker compose up --build typescript-agents

# Test the agent
curl -X POST http://localhost:3002/restaurant/search \
  -H "Content-Type: application/json" \
  -d '{"city": "Paris", "cuisine": "French"}'
```

### How to Add a New Python Agent

Let's add a "restaurant" agent in Python:

**Step 1: Create agent folder**
```bash
mkdir -p apps/python-agents/agents/restaurant
```

**Step 2: Create agent files**

Create `apps/python-agents/agents/restaurant/__init__.py` (empty file)

Create `apps/python-agents/agents/restaurant/agent.py`:
```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from .tools import search_restaurants_tool, get_restaurant_details_tool
from .prompts import RESTAURANT_SYSTEM_PROMPT

def create_restaurant_agent():
    llm = ChatOpenAI(model="gpt-4", temperature=0)

    tools = [search_restaurants_tool, get_restaurant_details_tool]

    prompt = ChatPromptTemplate.from_messages([
        ("system", RESTAURANT_SYSTEM_PROMPT),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    agent = create_openai_functions_agent(llm, tools, prompt)

    return AgentExecutor(agent=agent, tools=tools, verbose=True)
```

Create `apps/python-agents/agents/restaurant/tools.py`:
```python
from langchain.tools import tool
from .services.restaurant_api import search_restaurants, get_restaurant_details

@tool
def search_restaurants_tool(city: str, cuisine: str = None, price_range: str = None) -> str:
    """Search for restaurants in a city.

    Args:
        city: City to search in
        cuisine: Type of cuisine (optional)
        price_range: Price range (optional)
    """
    results = search_restaurants(city, cuisine, price_range)
    return str(results)

@tool
def get_restaurant_details_tool(restaurant_id: str) -> str:
    """Get details of a specific restaurant.

    Args:
        restaurant_id: Restaurant ID
    """
    details = get_restaurant_details(restaurant_id)
    return str(details)
```

Create `apps/python-agents/agents/restaurant/services/__init__.py` (empty)

Create `apps/python-agents/agents/restaurant/services/restaurant_api.py`:
```python
import os

def search_restaurants(city: str, cuisine: str = None, price_range: str = None):
    """Search for restaurants."""
    # Check if mock mode is enabled
    if os.getenv('USE_MOCK_RESPONSES', 'false').lower() == 'true':
        return [
            {
                "id": "rest1",
                "name": "Le Bistro",
                "cuisine": cuisine or "French",
                "city": city,
                "rating": 4.5,
                "price_range": price_range or "$$",
            }
        ]

    # TODO: Add real API call here
    # response = httpx.post('https://api.example.com/restaurants', json={
    #     'city': city,
    #     'cuisine': cuisine,
    #     'price_range': price_range
    # })
    # return response.json()

def get_restaurant_details(restaurant_id: str):
    """Get restaurant details."""
    if os.getenv('USE_MOCK_RESPONSES', 'false').lower() == 'true':
        return {
            "id": restaurant_id,
            "name": "Le Bistro",
            "description": "Authentic French cuisine",
        }

    # TODO: Add real API call here
```

Create `apps/python-agents/agents/restaurant/prompts.py`:
```python
RESTAURANT_SYSTEM_PROMPT = """You are a restaurant recommendation agent.
Your job is to help users find the perfect restaurant based on their preferences.
Use the available tools to search for restaurants and provide detailed information."""
```

Create `apps/python-agents/agents/restaurant/routes.py`:
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .agent import create_restaurant_agent

router = APIRouter()

class RestaurantSearchRequest(BaseModel):
    city: str
    cuisine: str = None
    price_range: str = None

@router.post("/search")
async def search_restaurants(request: RestaurantSearchRequest):
    try:
        agent = create_restaurant_agent()

        query = f"Search for restaurants in {request.city}"
        if request.cuisine:
            query += f" with {request.cuisine} cuisine"
        if request.price_range:
            query += f" in {request.price_range} price range"

        result = await agent.ainvoke({"input": query})

        return {"success": True, "data": result["output"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 3: Register routes in main app**

Edit `apps/python-agents/main.py`:
```python
from agents.restaurant.routes import router as restaurant_router

# ... existing code ...

app.include_router(restaurant_router, prefix="/restaurant", tags=["restaurant"])
```

**Step 4: Test the new agent**
```bash
# Rebuild and start
docker compose up --build python-agents

# Test the agent
curl -X POST http://localhost:8000/restaurant/search \
  -H "Content-Type: application/json" \
  -d '{"city": "Paris", "cuisine": "French"}'
```

**Step 5: Update API Gateway** (if needed)

Create `apps/api-gateway/src/routes/restaurant.routes.ts`:
```typescript
import express from 'express';
import { pythonAgentsClient } from '../services/pythonAgentsClient';
// Or: import { typescriptAgentsClient } from '../services/typescriptAgentsClient';

export const restaurantRouter = express.Router();

restaurantRouter.post('/search', async (req, res) => {
  try {
    // Forward to Python agent
    const result = await pythonAgentsClient.post('/restaurant/search', req.body);
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Register in `apps/api-gateway/src/routes/index.ts`:
```typescript
import { restaurantRouter } from './restaurant.routes';

export function registerRoutes(app: Express) {
  // ... existing routes ...
  app.use('/restaurants', restaurantRouter);
}
```

---

## Section 5: Adding Frontend Features

### Creating a New Feature Folder

Let's add a "restaurants" feature to the frontend:

**Step 1: Create feature folder structure**
```bash
mkdir -p apps/web/src/features/restaurants/{components,hooks,api,types}
```

**Step 2: Create type definitions**

Create `apps/web/src/features/restaurants/types/index.ts`:
```typescript
export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  city: string;
  rating: number;
  priceRange: string;
  description?: string;
}

export interface RestaurantSearchParams {
  city: string;
  cuisine?: string;
  priceRange?: string;
}
```

**Step 3: Create API client**

Create `apps/web/src/features/restaurants/api/restaurantApi.ts`:
```typescript
import { apiClient } from '@/lib/api-client';
import type { Restaurant, RestaurantSearchParams } from '../types';

export const restaurantApi = {
  search: async (params: RestaurantSearchParams): Promise<Restaurant[]> => {
    const response = await apiClient.post('/restaurants/search', params);
    return response.data.data;
  },

  getDetails: async (id: string): Promise<Restaurant> => {
    const response = await apiClient.get(`/restaurants/${id}`);
    return response.data.data;
  },
};
```

**Step 4: Create Zustand store (optional)**

Create `apps/web/src/features/restaurants/stores/restaurantStore.ts`:
```typescript
import { create } from 'zustand';
import type { Restaurant, RestaurantSearchParams } from '../types';
import { restaurantApi } from '../api/restaurantApi';

interface RestaurantState {
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  search: (params: RestaurantSearchParams) => Promise<void>;
  clearError: () => void;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  restaurants: [],
  loading: false,
  error: null,

  search: async (params) => {
    set({ loading: true, error: null });
    try {
      const results = await restaurantApi.search(params);
      set({ restaurants: results, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Search failed',
        loading: false
      });
    }
  },

  clearError: () => set({ error: null }),
}));
```

**Step 5: Create custom hook (alternative to Zustand)**

Create `apps/web/src/features/restaurants/hooks/useRestaurantSearch.ts`:
```typescript
import { useState } from 'react';
import { restaurantApi } from '../api/restaurantApi';
import type { Restaurant, RestaurantSearchParams } from '../types';

export const useRestaurantSearch = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (params: RestaurantSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const results = await restaurantApi.search(params);
      setRestaurants(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return { restaurants, loading, error, search };
};
```

**Step 6: Create components**

Create `apps/web/src/features/restaurants/components/RestaurantCard.tsx`:
```typescript
import { Card } from '@allorai/ui-components';
import type { Restaurant } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onSelect?: (restaurant: Restaurant) => void;
}

export function RestaurantCard({ restaurant, onSelect }: RestaurantCardProps) {
  return (
    <Card onClick={() => onSelect?.(restaurant)}>
      <h3>{restaurant.name}</h3>
      <p>{restaurant.cuisine} - {restaurant.priceRange}</p>
      <p>Rating: {restaurant.rating}/5</p>
      <p>{restaurant.city}</p>
    </Card>
  );
}
```

Create `apps/web/src/features/restaurants/components/RestaurantSearchForm.tsx`:
```typescript
import { useState } from 'react';
import { Button, SearchBar } from '@allorai/ui-components';
import type { RestaurantSearchParams } from '../types';

interface RestaurantSearchFormProps {
  onSearch: (params: RestaurantSearchParams) => void;
}

export function RestaurantSearchForm({ onSearch }: RestaurantSearchFormProps) {
  const [city, setCity] = useState('');
  const [cuisine, setCuisine] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ city, cuisine: cuisine || undefined });
  };

  return (
    <form onSubmit={handleSubmit}>
      <SearchBar
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter city..."
      />
      <input
        type="text"
        value={cuisine}
        onChange={(e) => setCuisine(e.target.value)}
        placeholder="Cuisine type (optional)"
      />
      <Button type="submit">Search</Button>
    </form>
  );
}
```

**Step 7: Create page component**

Create `apps/web/src/features/restaurants/RestaurantsPage.tsx`:
```typescript
import { useRestaurantStore } from './stores/restaurantStore';
// Or: import { useRestaurantSearch } from './hooks/useRestaurantSearch';
import { RestaurantSearchForm } from './components/RestaurantSearchForm';
import { RestaurantCard } from './components/RestaurantCard';
import { LoadingSpinner } from '@allorai/ui-components';

export function RestaurantsPage() {
  const { restaurants, loading, error, search } = useRestaurantStore();
  // Or: const { restaurants, loading, error, search } = useRestaurantSearch();

  return (
    <div>
      <h1>Find Restaurants</h1>

      <RestaurantSearchForm onSearch={search} />

      {loading && <LoadingSpinner />}

      {error && <div className="error">{error}</div>}

      <div className="grid">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
}
```

**Step 8: Add route**

Edit `apps/web/src/App.tsx`:
```typescript
import { RestaurantsPage } from './features/restaurants/RestaurantsPage';

// In your routes:
<Route path="/restaurants" element={<RestaurantsPage />} />
```

### Using Shared Components

Instead of creating new components, use shared ones:

```typescript
import { Button, Card, SearchBar, LoadingSpinner } from '@allorai/ui-components';

// These components are styled with TailwindCSS v4 and reusable
```

### Using Shared Types

Import types from the shared package:

```typescript
import type { APIResponse, PaginationParams } from '@allorai/types';

// Ensures consistency across frontend and backend
```

### Adding New Routes

Edit `apps/web/src/App.tsx`:
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FlightsPage } from './features/flights/FlightsPage';
import { HotelsPage } from './features/hotels/HotelsPage';
import { RestaurantsPage } from './features/restaurants/RestaurantsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="flights" element={<FlightsPage />} />
          <Route path="hotels" element={<HotelsPage />} />
          <Route path="restaurants" element={<RestaurantsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Section 6: Using Shared Packages

### How to Use @allorai/types

**In frontend code** (`apps/web/`):
```typescript
import type { Flight, FlightSearchRequest, APIResponse } from '@allorai/types';

const searchFlights = async (params: FlightSearchRequest): Promise<APIResponse<Flight[]>> => {
  // Type-safe API call
};
```

**In backend code** (`apps/api-gateway/` or `apps/typescript-agents/`):
```typescript
import type { Flight, APIResponse } from '@allorai/types';
import express from 'express';

app.post('/flights/search', async (req, res) => {
  const response: APIResponse<Flight[]> = {
    success: true,
    data: flights,
  };
  res.json(response);
});
```

### How to Use @allorai/ui-components

```typescript
import { Button, Card, SearchBar, LoadingSpinner } from '@allorai/ui-components';

function MyComponent() {
  return (
    <Card>
      <SearchBar placeholder="Search..." />
      <Button variant="primary">Click me</Button>
      <LoadingSpinner />
    </Card>
  );
}
```

### How to Use @allorai/utils

```typescript
import { formatDate, formatCurrency, validateEmail } from '@allorai/utils';

const displayDate = formatDate(new Date(), 'MMM dd, yyyy');
const price = formatCurrency(99.99, 'USD');
const isValid = validateEmail('user@example.com');
```

### Adding New Shared Types

Edit `packages/types/src/restaurant.types.ts`:
```typescript
export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
}

export interface RestaurantSearchRequest {
  city: string;
  cuisine?: string;
}

export interface RestaurantSearchResponse {
  restaurants: Restaurant[];
  total: number;
}
```

Export in `packages/types/src/index.ts`:
```typescript
export * from './restaurant.types';
```

Now available everywhere:
```typescript
import type { Restaurant } from '@allorai/types';
```

### Adding New Shared Components

Create `packages/ui-components/src/RestaurantCard.tsx`:
```typescript
import React from 'react';

export interface RestaurantCardProps {
  name: string;
  cuisine: string;
  rating: number;
  onClick?: () => void;
}

/**
 * Displays restaurant information in a card format
 * @param props - Component props
 */
export function RestaurantCard({ name, cuisine, rating, onClick }: RestaurantCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg cursor-pointer" onClick={onClick}>
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="text-gray-600">{cuisine}</p>
      <p className="text-yellow-500">* {rating}/5</p>
    </div>
  );
}
```

Export in `packages/ui-components/src/index.ts`:
```typescript
export { RestaurantCard } from './RestaurantCard';
export type { RestaurantCardProps } from './RestaurantCard';
```

Use anywhere:
```typescript
import { RestaurantCard } from '@allorai/ui-components';
```

### Adding New Shared Utils

Create `packages/utils/src/restaurant-utils.ts`:
```typescript
/**
 * Formats restaurant rating for display
 * @param rating - Numeric rating (0-5)
 * @returns Formatted rating string with stars
 */
export function formatRating(rating: number): string {
  const stars = '*'.repeat(Math.floor(rating));
  const halfStar = rating % 1 >= 0.5 ? '1/2' : '';
  return `${stars}${halfStar} (${rating})`;
}

/**
 * Validates restaurant rating
 * @param rating - Rating to validate
 * @returns True if valid (0-5 range)
 */
export function isValidRating(rating: number): boolean {
  return rating >= 0 && rating <= 5;
}
```

Export in `packages/utils/src/index.ts`:
```typescript
export * from './restaurant-utils';
```

---

## Section 7: API Keys and Environment Variables

### Which Keys Are Needed for Which Services

| Service | Required Keys | Purpose |
|---------|--------------|---------|
| **typescript-agents** | `OPENAI_API_KEY`, `AMADEUS_API_KEY`, `AMADEUS_API_SECRET` | LangChain agents, flight search |
| **python-agents** | `OPENAI_API_KEY` | LangChain agents |
| **api-gateway** | None | Proxies requests only |
| **web** | `VITE_API_GATEWAY_URL` | Frontend API endpoint (build-time) |

### Where to Get API Keys

**OpenAI API Key** (for LangChain)
1. Visit https://platform.openai.com/
2. Sign up or log in
3. Go to API Keys section
4. Create new secret key
5. Copy key (starts with `sk-`)

**Amadeus API Keys** (for flight data)
1. Visit https://developers.amadeus.com/
2. Sign up for free account
3. Create new app
4. Get API Key and API Secret
5. Use test environment for development

### Mock Mode vs. Real API Mode

**Mock Mode** (Default):
```bash
# In .env file
USE_MOCK_RESPONSES=true
OPENAI_API_KEY=mock
AMADEUS_API_KEY=mock
AMADEUS_API_SECRET=mock
```

- No real API calls made
- Instant responses with fake data
- No costs incurred
- Perfect for development

**Real API Mode**:
```bash
# In .env file
USE_MOCK_RESPONSES=false
OPENAI_API_KEY=sk-your-real-key-here
AMADEUS_API_KEY=your-real-key
AMADEUS_API_SECRET=your-real-secret
```

- Real API calls made
- Real data returned
- Costs incurred per request
- Use for production or testing

### How to Switch Modes

1. Edit `.env` file
2. Change `USE_MOCK_RESPONSES=false`
3. Add real API keys
4. Restart services:
```bash
docker compose restart
```

---

## Section 8: Common Issues and Solutions

### "Port already in use"

**Problem**: Error: `Bind for 0.0.0.0:5173 failed: port is already allocated`

**Solution 1**: Find and kill the process using the port
```bash
# On Mac/Linux
lsof -ti:5173 | xargs kill -9

# On Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Solution 2**: Change port in docker-compose.yml
```yaml
services:
  web:
    ports:
      - "5174:5173"  # Changed external port to 5174
```

### "Module not found"

**Problem**: `Error: Cannot find module '@allorai/types'`

**Cause**: TypeScript workspace references not set up correctly

**Solution 1**: Rebuild containers
```bash
docker compose down
docker compose up --build
```

**Solution 2**: Check tsconfig.json references
```json
{
  "references": [
    { "path": "../../packages/types" },
    { "path": "../../packages/utils" }
  ]
}
```

**Solution 3**: Check package.json dependencies
```json
{
  "dependencies": {
    "@allorai/types": "workspace:*"
  }
}
```

### "Cannot connect to Docker daemon"

**Problem**: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`

**Solution**:
- **Windows/Mac**: Start Docker Desktop
- **Linux**: Start Docker service
```bash
sudo systemctl start docker
sudo systemctl enable docker  # Auto-start on boot
```

### "Changes not reflecting"

**Problem**: Modified code but don't see changes in browser/API

**Solution 1**: Check if file is mounted in docker-compose.yml
```yaml
volumes:
  - ./apps/web:/app/apps/web  # Should be present
```

**Solution 2**: Rebuild the service
```bash
docker compose up --build web
```

**Solution 3**: Hard reload browser (Ctrl+Shift+R / Cmd+Shift+R)

**Solution 4**: Check for TypeScript errors
```bash
docker compose logs web
```

### TypeScript errors with workspace packages

**Problem**: `Cannot find module '@allorai/types' or its corresponding type declarations`

**Solution 1**: Ensure tsconfig paths are correct
```json
// In root tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@allorai/types": ["./packages/types/src"]
    }
  }
}
```

**Solution 2**: For Rsbuild apps, add source.alias
```typescript
// rsbuild.config.ts
import path from 'path';

export default defineConfig({
  source: {
    alias: {
      '@allorai/types': path.resolve(__dirname, '../../packages/types/src'),
    }
  }
});
```

**Solution 3**: Ensure composite: true in package tsconfig
```json
// packages/types/tsconfig.json
{
  "compilerOptions": {
    "composite": true
  }
}
```

### pnpm-lock.yaml conflicts

**Problem**: Merge conflicts in pnpm-lock.yaml

**Solution**:
```bash
# Delete lock file
rm pnpm-lock.yaml

# Regenerate from package.json files
pnpm install

# Commit new lock file
git add pnpm-lock.yaml
git commit -m "Regenerate pnpm-lock.yaml"
```

### Docker out of space

**Problem**: `no space left on device`

**Solution**: Clean up Docker resources
```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove volumes (WARNING: deletes data)
docker system prune -a --volumes
```

### Python dependencies not installing

**Problem**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**: Rebuild Python container
```bash
docker compose build --no-cache python-agents
docker compose up python-agents
```

---

## Section 9: Useful Commands

### Docker Compose Commands

```bash
# Start all services
docker compose up

# Start in background (detached)
docker compose up -d

# Start with rebuild
docker compose up --build

# Start specific services
docker compose up web api-gateway

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f web

# Restart a service
docker compose restart web

# Rebuild a service
docker compose build web

# Rebuild without cache
docker compose build --no-cache web

# Execute command in running container
docker compose exec web sh
docker compose exec python-agents bash

# List running services
docker compose ps

# View service status
docker compose top
```

### pnpm Workspace Commands

```bash
# Install all dependencies (from root)
pnpm install

# Install in specific workspace
pnpm --filter @allorai/web install

# Add dependency to specific workspace
pnpm --filter @allorai/web add react-query

# Remove dependency from specific workspace
pnpm --filter @allorai/web remove react-query

# Run script in specific workspace
pnpm --filter @allorai/web dev

# Run script in all workspaces
pnpm -r dev

# Build all packages
pnpm -r build

# Clean all node_modules
pnpm -r clean
```

### NX Commands

```bash
# Run a target for all projects
nx run-many --target=build

# Run a target for a specific project
nx run @allorai/web:build

# View project graph
nx graph

# View affected projects (based on git changes)
nx affected --target=build

# Clear NX cache
nx reset
```

### Accessing Container Shells

```bash
# Node.js containers (Alpine Linux)
docker compose exec web sh
docker compose exec api-gateway sh
docker compose exec typescript-agents sh

# Python container
docker compose exec python-agents bash

# Run commands in container
docker compose exec web pnpm install
docker compose exec python-agents pip install requests
```

### Viewing Logs

```bash
# All logs
docker compose logs

# Follow logs (live)
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Specific service
docker compose logs -f web

# Multiple services
docker compose logs -f web api-gateway

# With timestamps
docker compose logs -f -t web
```

### Cleaning Up Docker Resources

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Remove everything (be careful!)
docker system prune -a --volumes

# View disk usage
docker system df
```

---

## Section 10: Testing

### Running Tests for Frontend

```bash
# From host machine
docker compose exec web pnpm test

# Or add to package.json:
{
  "scripts": {
    "test": "vitest"
  }
}
```

Create `apps/web/src/features/flights/__tests__/FlightsPage.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlightsPage } from '../FlightsPage';

describe('FlightsPage', () => {
  it('renders search form', () => {
    render(<FlightsPage />);
    expect(screen.getByPlaceholderText(/origin/i)).toBeInTheDocument();
  });
});
```

### Running Tests for Backend

**TypeScript tests**:
```bash
# Add jest or vitest
docker compose exec typescript-agents pnpm test
```

**Python tests**:
```bash
# Add pytest to requirements.txt
docker compose exec python-agents pytest
```

Create `apps/python-agents/agents/hotel/tests/test_agent.py`:
```python
import pytest
from agents.hotel.agent import create_hotel_agent

def test_create_hotel_agent():
    agent = create_hotel_agent()
    assert agent is not None

@pytest.mark.asyncio
async def test_hotel_search():
    # Mock test
    result = await search_hotels("Paris")
    assert len(result) > 0
```

### Testing Individual Agents

**Direct agent testing**:
```bash
# Start only the agent service
docker compose up typescript-agents

# Test with curl
curl -X POST http://localhost:3002/flight/search \
  -H "Content-Type: application/json" \
  -d '{"origin": "JFK", "destination": "LAX", "date": "2024-06-01"}'
```

### Integration Testing Across Services

Create `tests/integration/test_full_flow.sh`:
```bash
#!/bin/bash

# Test full trip planning flow
echo "Testing coordinator..."
response=$(curl -s -X POST http://localhost:3001/coordinate \
  -H "Content-Type: application/json" \
  -d '{"query": "Plan a trip to Paris"}')

echo "Response: $response"

# Check if response contains expected data
if echo "$response" | grep -q "success"; then
  echo "Test passed"
  exit 0
else
  echo "Test failed"
  exit 1
fi
```

Run integration tests:
```bash
chmod +x tests/integration/test_full_flow.sh
./tests/integration/test_full_flow.sh
```

---

## Section 11: Switching Manager/Coordinator Language

The coordinator agent orchestrates all sub-agents. You can choose between Python (default) or TypeScript.

### How to Use Python Coordinator (Default)

**Already configured!** The Python coordinator is the default.

**Location**: `apps/python-agents/agents/coordinator/`

**Features**:
- Uses LangGraph for workflow orchestration
- State machine with conditional routing
- Parallel agent execution
- Advanced error handling

**Files**:
- `agent.py` - Main coordinator logic
- `graph.py` - LangGraph state machine
- `tools.py` - Agent delegation functions
- `routes.py` - FastAPI endpoints

**How it works**:
1. API Gateway forwards `/coordinate` to Python agents
2. Python coordinator analyzes user query
3. Creates LangGraph workflow
4. Executes nodes (agents) based on state
5. Aggregates results
6. Returns to frontend

### How to Switch to TypeScript Coordinator

**Step 1**: Verify TypeScript coordinator exists

Check `apps/typescript-agents/src/agents/coordinator/` has:
- `agent.ts`
- `tools.ts`
- `routes.ts`
- `prompts.ts`

**Step 2**: Update API Gateway routes

Edit `apps/api-gateway/src/routes/coordinator.routes.ts`:

**Before** (Python coordinator):
```typescript
const COORDINATOR_URL = process.env.PYTHON_AGENTS_URL + '/coordinate';
```

**After** (TypeScript coordinator):
```typescript
const COORDINATOR_URL = process.env.TYPESCRIPT_AGENTS_URL + '/coordinate';
```

**Step 3**: Restart API Gateway
```bash
docker compose restart api-gateway
```

**Step 4**: Test
```bash
curl -X POST http://localhost:3001/coordinate \
  -H "Content-Type: application/json" \
  -d '{"query": "Plan a trip to Paris"}'
```

### Pros/Cons of Each Approach

**Python Coordinator (Default)**

Pros:
- LangGraph provides powerful workflow orchestration
- Better for complex state machines
- Rich ecosystem for AI/ML
- Easier to add Python-based agents

Cons:
- Mixed language stack
- Slightly more complex debugging

**TypeScript Coordinator**

Pros:
- Single language for all services (except Python agents)
- Easier debugging with full stack in TS
- Type safety across coordinator

Cons:
- Less sophisticated workflow orchestration
- No LangGraph equivalent in TypeScript
- Simpler sequential agent calls

### Running Both Coordinators Simultaneously

You can keep both and switch via environment variable:

Edit `apps/api-gateway/src/routes/coordinator.routes.ts`:
```typescript
const USE_PYTHON_COORDINATOR = process.env.USE_PYTHON_COORDINATOR !== 'false';

const COORDINATOR_URL = USE_PYTHON_COORDINATOR
  ? process.env.PYTHON_AGENTS_URL + '/coordinate'
  : process.env.TYPESCRIPT_AGENTS_URL + '/coordinate';
```

Then in `.env`:
```bash
# Use Python coordinator
USE_PYTHON_COORDINATOR=true

# Or use TypeScript coordinator
USE_PYTHON_COORDINATOR=false
```

---

## Section 12: Package Management in Docker

This section covers how to install and remove packages within Docker containers, and how to recover from accidentally using npm instead of pnpm.

### Installing Python Packages (pip)

**Add a package to the Python agents container**:

```bash
# Enter the running container
docker compose exec python-agents bash

# Install a package
pip install <package-name>

# Example: Install requests
pip install requests

# Exit the container
exit
```

**Make the package permanent** (persists after container rebuild):

Edit `apps/python-agents/requirements.txt`:
```txt
# Add your new package
requests==2.31.0
```

Then rebuild:
```bash
docker compose build python-agents
docker compose up python-agents
```

**Remove a Python package**:

```bash
# Enter the container
docker compose exec python-agents bash

# Remove the package
pip uninstall <package-name>

# Exit
exit
```

**Make removal permanent**: Remove the package from `apps/python-agents/requirements.txt` and rebuild.

**View installed packages**:
```bash
docker compose exec python-agents pip list
docker compose exec python-agents pip freeze
```

### Installing Node.js Packages (pnpm)

**IMPORTANT**: Always use `pnpm`, never `npm`, in this project. The monorepo is configured for pnpm workspaces.

**Add a package to a specific app/package**:

```bash
# Enter the container
docker compose exec web sh

# Install a package (from the app directory)
cd /app/apps/web
pnpm add <package-name>

# Example: Install axios
pnpm add axios

# Install as dev dependency
pnpm add -D <package-name>

# Exit
exit
```

**Alternatively, from the host machine** (if pnpm is installed locally):

```bash
# Add to a specific workspace
pnpm --filter @allorai/web add axios
pnpm --filter @allorai/api-gateway add cors

# Add as dev dependency
pnpm --filter @allorai/web add -D vitest
```

**Remove a Node.js package**:

```bash
# From inside container
docker compose exec web sh
cd /app/apps/web
pnpm remove <package-name>
exit

# Or from host machine
pnpm --filter @allorai/web remove axios
```

**Add package to root (shared dev dependency)**:

```bash
pnpm add -D -w prettier  # -w means workspace root
```

**View installed packages**:
```bash
docker compose exec web pnpm list
docker compose exec web pnpm list --depth=0  # Top-level only
```

### Recovering from Accidentally Using npm

If someone accidentally runs `npm install` instead of `pnpm install`, it creates a `package-lock.json` file and may corrupt the `node_modules`. Here's how to recover:

**Step 1: Stop all services**
```bash
docker compose down
```

**Step 2: Remove npm artifacts**
```bash
# Remove package-lock.json files (npm creates these)
find . -name "package-lock.json" -type f -delete

# Remove all node_modules directories
find . -name "node_modules" -type d -prune -exec rm -rf {} +

# Also remove the pnpm lock file to regenerate it cleanly
rm -f pnpm-lock.yaml
```

**Step 3: Clean Docker volumes**
```bash
# Remove Docker volumes that may have cached node_modules
docker compose down -v

# Prune any dangling volumes
docker volume prune -f
```

**Step 4: Reinstall with pnpm**
```bash
# If pnpm is installed locally
pnpm install

# This regenerates pnpm-lock.yaml from package.json files
```

**Step 5: Rebuild Docker containers**
```bash
docker compose build --no-cache
docker compose up
```

**Full recovery script** (save as `scripts/recover-npm-accident.sh`):
```bash
#!/bin/bash
echo "Recovering from npm accident..."

# Stop services
docker compose down -v

# Remove npm artifacts
echo "Removing package-lock.json files..."
find . -name "package-lock.json" -type f -delete

# Remove node_modules
echo "Removing node_modules directories..."
find . -name "node_modules" -type d -prune -exec rm -rf {} +

# Remove lock file
echo "Removing pnpm-lock.yaml..."
rm -f pnpm-lock.yaml

# Remove .nx cache
echo "Removing NX cache..."
rm -rf .nx

# Reinstall
echo "Reinstalling with pnpm..."
pnpm install

# Rebuild Docker
echo "Rebuilding Docker containers..."
docker compose build --no-cache

echo "Recovery complete! Run 'docker compose up' to start services."
```

Make it executable:
```bash
chmod +x scripts/recover-npm-accident.sh
```

### Preventing npm Usage

**Add to your shell profile** (`~/.bashrc` or `~/.zshrc`):
```bash
# Warn when using npm in pnpm projects
npm() {
  if [ -f "pnpm-workspace.yaml" ] || [ -f "pnpm-lock.yaml" ]; then
    echo "WARNING: This is a pnpm project! Use 'pnpm' instead of 'npm'"
    echo "Run the command with pnpm instead? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
      pnpm "$@"
    fi
  else
    command npm "$@"
  fi
}
```

**Add a preinstall script** to root `package.json`:
```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```

This will error if someone tries to use npm or yarn.

### Quick Reference: Package Commands in Docker

| Action | pnpm (Node.js) | pip (Python) |
|--------|----------------|--------------|
| Install package | `docker compose exec web pnpm add <pkg>` | `docker compose exec python-agents pip install <pkg>` |
| Install dev dep | `docker compose exec web pnpm add -D <pkg>` | N/A |
| Remove package | `docker compose exec web pnpm remove <pkg>` | `docker compose exec python-agents pip uninstall <pkg>` |
| List packages | `docker compose exec web pnpm list` | `docker compose exec python-agents pip list` |
| Update package | `docker compose exec web pnpm update <pkg>` | `docker compose exec python-agents pip install --upgrade <pkg>` |

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [pnpm Documentation](https://pnpm.io/)
- [NX Documentation](https://nx.dev/getting-started/intro)
- [LangChain Documentation](https://python.langchain.com/docs/get_started/introduction)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Rsbuild Documentation](https://rsbuild.dev/)
- [TailwindCSS v4 Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

---

## Need Help?

1. Check this guide first
2. Look at code comments in the repository
3. Check Docker logs: `docker compose logs -f`
4. Open an issue on GitHub
5. Ask the team in Slack/Discord

Happy coding!
