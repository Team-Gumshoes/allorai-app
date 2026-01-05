import express, { Request, Response } from 'express';
import { config } from './config/env.js';
import { corsMiddleware } from './middleware/cors.middleware.js';
import { loggerMiddleware } from './middleware/logger.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import routes from './routes/index.js';

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Allorai API Gateway',
    version: '1.0.0',
    description: 'Gateway for multi-agent travel orchestration',
    endpoints: {
      health: '/api/health',
      flights: '/api/flights',
      hotels: '/api/hotels',
      transport: '/api/transport',
      coordinate: '/api/coordinate',
    },
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start server
app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Allorai API Gateway                                  ║
║                                                           ║
║   Port:        ${config.port}                                      ║
║   Environment: ${config.nodeEnv}                             ║
║                                                           ║
║   Services:                                               ║
║   • TypeScript Agents: ${config.typescriptAgentsUrl.padEnd(30)} ║
║   • Python Agents:     ${config.pythonAgentsUrl.padEnd(30)} ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
