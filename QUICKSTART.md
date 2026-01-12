# AllorAI - Quick Start Guide

Get AllorAI up and running in 5 minutes! This guide will help you start all services with Docker, no complex setup required.

## Prerequisites

You only need **two things**:

1. **Docker Desktop** (includes Docker Compose)

   - Windows/Mac: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)

2. **Git**
   - Already installed on most systems
   - Check with: `git --version`

That's it! No need to install Node.js, Python, pnpm, or any other dependencies.

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd allorai-app
```

Status: Repository cloned

## Step 2: Copy Environment File

The project includes a `.env.development` file with mock values for easy development:

```bash
# On Mac/Linux:
cp .env.development .env

# On Windows (Command Prompt):
copy .env.development .env

# On Windows (PowerShell):
Copy-Item .env.development .env
```

Status: Environment configured (using mock mode)

**Note**: The default configuration uses mock data, so you don't need real API keys to get started!

## Step 3: Start All Services

```bash
docker compose up --build
```

This will:

- Pull Docker images (first time only)
- Build all services
- Install dependencies
- Start all containers

**First-time startup takes 3-5 minutes.** Subsequent starts are much faster!

Wait until you see messages like:

```
web_1                | Rsbuild ready in 1234 ms
api-gateway_1        | Server listening on port 3001
typescript-agents_1  | TypeScript agents ready on port 3002
python-agents_1      | Uvicorn running on port 8000
```

Status: All services running

## Step 4: Access the Application

Open your browser and visit:

- **Frontend**: http://localhost:5173

  - Main application UI
  - Trip planning interface

- **API Gateway**: http://localhost:3001/health

  - Should return: `{"status": "ok"}`

- **TypeScript Agents**: http://localhost:3002/health

  - Should return: `{"status": "ok"}`

- **Python Agents**: http://localhost:8000/docs
  - FastAPI interactive documentation

Status: Application accessible

## Step 5: Test the API

Try these example curl commands to test the agents:

### Test Flight Search (TypeScript Agent)

```bash
curl -X POST http://localhost:3001/flights/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "JFK",
    "destination": "LAX",
    "date": "2024-06-01",
    "passengers": 1
  }'
```

### Test Hotel Search (Python Agent)

```bash
curl -X POST http://localhost:3001/hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Paris",
    "checkIn": "2024-06-01",
    "checkOut": "2024-06-05",
    "guests": 2
  }'
```

### Test Coordinator (Full Trip Planning)

```bash
curl -X POST http://localhost:3001/coordinate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Plan a 3-day trip to Paris for 2 people starting June 1st"
  }'
```

Status: APIs tested and working

## Common First-Time Issues

### Issue: Port Already in Use

**Error**: `Bind for 0.0.0.0:5173 failed: port is already allocated`

**Solution**:

```bash
# Stop all services
docker compose down

# Find what's using the port (example for port 5173)
# On Mac/Linux:
lsof -i :5173

# On Windows:
netstat -ano | findstr :5173

# Kill the process or change the port in docker-compose.yml
```

### Issue: Docker Daemon Not Running

**Error**: `Cannot connect to the Docker daemon`

**Solution**:

- Make sure Docker Desktop is running
- On Windows: Check system tray for Docker icon
- On Mac: Check menu bar for Docker icon
- On Linux: `sudo systemctl start docker`

### Issue: Changes Not Reflecting

**Problem**: You modified code but don't see changes

**Solution**:

```bash
# Rebuild the specific service
docker compose up --build web

# Or rebuild everything
docker compose up --build
```

### Issue: Module Not Found (TypeScript)

**Error**: `Cannot find module '@allorai/types'`

**Solution**:

```bash
# Rebuild to reinstall dependencies
docker compose down
docker compose up --build
```

## Next Steps

You're all set! Here's what to do next:

1. **Explore the Application**

   - Visit http://localhost:5173
   - Try planning a trip
   - Explore different features (flights, hotels, transport)

2. **Read the Development Guide**

   - See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development workflows
   - Learn how to add new agents
   - Understand the architecture

3. **Start Developing**

   - Make changes to files in `apps/` or `packages/`
   - Changes will hot-reload automatically
   - Check Docker logs if something breaks

4. **Switch to Real APIs** (Optional)
   - Get API keys (see [DEVELOPMENT.md - Section 7](./DEVELOPMENT.md#section-7-api-keys-and-environment-variables))
   - Update `.env` file
   - Set `USE_MOCK_RESPONSES=false`

## Useful Commands

```bash
# Start all services
docker compose up

# Start in detached mode (background)
docker compose up -d

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f web

# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v

# Rebuild and start
docker compose up --build

# Access container shell
docker compose exec web sh
docker compose exec python-agents bash
```

## Visual Progress Indicators

Throughout this guide, you'll see:

- Done - Step completed successfully
- In progress - Step is running
- Error - Something went wrong

## Getting Help

If you run into issues:

1. Check the [Common Issues](#common-first-time-issues) section above
2. Read [DEVELOPMENT.md - Section 8](./DEVELOPMENT.md#section-8-common-issues-and-solutions)
3. Check Docker logs: `docker compose logs -f`
4. Open an issue on GitHub

## What's Running?

After starting all services, you have:

- **Frontend (web)**: React app with Rsbuild on http://localhost:5173
- **API Gateway**: Request router on http://localhost:3001
- **TypeScript Agents**: Flight agent + optional coordinator on http://localhost:3002
- **Python Agents**: Hotel, transport, and coordinator agents on http://localhost:8000

All services communicate over a Docker network and can talk to each other!

## Technology Stack Summary

| Component         | Technology                                    |
| ----------------- | --------------------------------------------- |
| Frontend          | React 18 + Rsbuild + TailwindCSS v4 + Zustand |
| API Gateway       | Express + TypeScript                          |
| TypeScript Agents | LangChain + Express                           |
| Python Agents     | LangGraph + FastAPI                           |
| Monorepo          | pnpm workspaces + NX                          |
| Containers        | Docker + Docker Compose                       |

---

**Congratulations!** You've successfully set up AllorAI. Happy coding!
