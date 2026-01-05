# API Gateway

Express.js + TypeScript API Gateway for Allorai multi-agent orchestration system.

## Overview

The API Gateway serves as the central entry point for all client requests, routing them to the appropriate agent services (TypeScript or Python).

## Architecture

```
Client Request
     ↓
API Gateway (Express, port 3001)
     ↓
     ├─→ /api/flights/* → TypeScript Agents (port 3002)
     ├─→ /api/hotels/* → Python Agents (port 8000)
     ├─→ /api/transport/* → Python Agents (port 8000)
     └─→ /api/coordinate → Python Agents (port 8000)
```

## Features

- **ES Modules**: Full ESM support with `"type": "module"`
- **TypeScript**: Strongly typed with NodeNext module resolution
- **CORS**: Configurable CORS middleware
- **Error Handling**: Centralized error handling with proper status codes
- **Logging**: Request/response logging middleware
- **Service Clients**: Typed HTTP clients for agent services
- **Environment Config**: Centralized configuration management

## Project Structure

```
apps/api-gateway/
├── src/
│   ├── config/
│   │   └── env.ts                    # Environment configuration
│   ├── middleware/
│   │   ├── cors.middleware.ts        # CORS configuration
│   │   ├── error.middleware.ts       # Error handling
│   │   └── logger.middleware.ts      # Request logging
│   ├── routes/
│   │   ├── index.ts                  # Route aggregator
│   │   ├── flights.routes.ts         # Flight endpoints
│   │   ├── hotels.routes.ts          # Hotel endpoints
│   │   ├── transport.routes.ts       # Transport endpoints
│   │   └── coordinator.routes.ts     # Coordination endpoints
│   ├── services/
│   │   ├── typescriptAgentsClient.ts # TS agents HTTP client
│   │   └── pythonAgentsClient.ts     # Python agents HTTP client
│   └── index.ts                      # Main server
├── Dockerfile                        # Multi-stage Docker build
├── package.json                      # Dependencies
└── tsconfig.json                     # TypeScript config
```

## API Endpoints

### Health Check
- `GET /api/health` - Service health status

### Flights (→ TypeScript Agents)
- `POST /api/flights/search` - Search for flights
- `GET /api/flights/:flightId` - Get flight details
- `POST /api/flights/book` - Book a flight
- `DELETE /api/flights/bookings/:bookingId` - Cancel booking

### Hotels (→ Python Agents)
- `POST /api/hotels/search` - Search for hotels
- `GET /api/hotels/:hotelId` - Get hotel details
- `GET /api/hotels/:hotelId/rooms` - Get room availability
- `POST /api/hotels/book` - Book a hotel room
- `DELETE /api/hotels/bookings/:bookingId` - Cancel booking

### Transport (→ Python Agents)
- `POST /api/transport/search` - Search transport options
- `GET /api/transport/:transportId` - Get transport details
- `POST /api/transport/book` - Book transport
- `DELETE /api/transport/bookings/:bookingId` - Cancel booking
- `GET /api/transport/vehicles/types` - Get vehicle types

### Coordination (→ Python Agents)
- `POST /api/coordinate` - Create coordinated travel plan
- `GET /api/coordinate/status/:coordinationId` - Get coordination status
- `DELETE /api/coordinate/:coordinationId` - Cancel coordination

## Development

### Prerequisites
- Node.js 20+
- pnpm (recommended) or npm

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`

### Running Locally

Development mode with hot reload:
```bash
pnpm dev
```

Production build:
```bash
pnpm build
pnpm start
```

## Docker

### Build
```bash
# From monorepo root
docker build -f apps/api-gateway/Dockerfile -t allorai-api-gateway .
```

### Run
```bash
docker run -p 3001:3001 \
  -e TYPESCRIPT_AGENTS_URL=http://typescript-agents:3002 \
  -e PYTHON_AGENTS_URL=http://python-agents:8000 \
  allorai-api-gateway
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `TYPESCRIPT_AGENTS_URL` | TypeScript agents service URL | `http://localhost:3002` |
| `PYTHON_AGENTS_URL` | Python agents service URL | `http://localhost:8000` |
| `CORS_ORIGIN` | CORS allowed origins | `*` |
| `LOG_LEVEL` | Logging level | `info` |

## Dependencies

### Production
- `express` - Web framework
- `cors` - CORS middleware
- `axios` - HTTP client
- `dotenv` - Environment variables
- `@allorai/types` - Shared types
- `@allorai/utils` - Shared utilities

### Development
- `typescript` - Type checking
- `tsx` - TypeScript execution
- `@types/*` - Type definitions

## Notes

- The coordinator currently uses the Python agents service
- A TypeScript coordinator implementation can be added and routed via `typescriptAgentsClient`
- All routes include proper error handling and type safety
- The service uses axios interceptors for logging all HTTP requests/responses
