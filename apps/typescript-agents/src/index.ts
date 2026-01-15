/**
 * Main Express application for TypeScript Agents Service.
 *
 * This service provides AI-powered travel planning agents using:
 * - Express for HTTP endpoints
 * - LangChain for agent orchestration
 * - OpenAI for LLM capabilities
 *
 * Available agents:
 * - Flight Agent: Search flights and get flight details
 * - Hotel Agent: Search and book hotels
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config, validateConfig } from './shared/config.js';
import { flightRouter } from './agents/flight/routes.js';
import { hotelRouter } from './agents/hotel/routes.js';

// Validate configuration on startup
validateConfig();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount agent routers
app.use('/api/v1', flightRouter);
app.use('/api/v1', hotelRouter);

// Root endpoint with service information
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'typescript-agents',
    version: '1.0.0',
    status: 'running',
    agents: {
      flight: {
        status: 'active',
        endpoint: '/api/v1/flight',
      },
      hotel: {
        status: 'active',
        endpoint: '/api/v1/hotel',
      },
    },
    environment: config.nodeEnv,
    mock_mode: config.useMockResponses,
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'typescript-agents',
    version: '1.0.0',
  });
});

// API info endpoint
app.get('/api/v1/info', (_req: Request, res: Response) => {
  res.json({
    service: 'TypeScript Agents Service',
    version: '1.0.0',
    description: 'AI-powered travel planning agents',
    endpoints: {
      flight: {
        search: 'POST /api/v1/flight/search',
        details: 'GET /api/v1/flight/:id',
        health: 'GET /api/v1/flight/health',
        description: 'Search flights and get flight details',
      },
      hotel: {
        search: 'POST /api/v1/hotel/search',
        health: 'GET /api/v1/hotel/health',
        description: 'Search and book hotels',
      },
    },
    technologies: ['Express', 'LangChain', 'OpenAI', 'TypeScript', 'Node.js'],
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'An error occurred',
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
  });
});

// Start server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`TypeScript Agents Service started`);
  console.log(`  - Port: ${config.port}`);
  console.log(`  - Environment: ${config.nodeEnv}`);
  console.log(`  - Mock mode: ${config.useMockResponses}`);
  console.log(`  - Endpoints:`);
  console.log(`    - GET  /           - Service info`);
  console.log(`    - GET  /health     - Health check`);
  console.log(`    - GET  /api/v1/info - API documentation`);
  console.log(`    - POST /api/v1/flight/search - Search flights`);
  console.log(`    - GET  /api/v1/flight/:id    - Get flight details`);
  console.log(`    - POST /api/v1/hotel/search  - Search hotels`);
});
