import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Service URLs
  typescriptAgentsUrl: process.env.TYPESCRIPT_AGENTS_URL || 'http://localhost:3002',
  pythonAgentsUrl: process.env.PYTHON_AGENTS_URL || 'http://localhost:8000',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export type Config = typeof config;
