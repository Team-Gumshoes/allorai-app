import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  openaiApiKey: string;
  useMockResponses: boolean;
  amadeusApiKey: string;
  amadeusApiSecret: string;
  flightAgentUrl: string;
  hotelAgentUrl: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY || '',

  // Mock mode configuration - when true, use mock data instead of real API calls
  useMockResponses: process.env.USE_MOCK_RESPONSES === 'true',

  // Amadeus API credentials (for real flight data)
  amadeusApiKey: process.env.AMADEUS_API_KEY || '',
  amadeusApiSecret: process.env.AMADEUS_API_SECRET || '',

  // Inter-agent communication URLs
  flightAgentUrl: process.env.FLIGHT_AGENT_URL || 'http://localhost:3002',
  hotelAgentUrl: process.env.HOTEL_AGENT_URL || 'http://localhost:3001',
};

// Validate required configuration
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.openaiApiKey && !config.useMockResponses) {
    errors.push('OPENAI_API_KEY is required when not using mock mode');
  }

  if (!config.useMockResponses) {
    if (!config.amadeusApiKey) {
      errors.push('AMADEUS_API_KEY is required when not using mock mode');
    }
    if (!config.amadeusApiSecret) {
      errors.push('AMADEUS_API_SECRET is required when not using mock mode');
    }
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    console.info('\nTip: Set USE_MOCK_RESPONSES=true to run without API credentials');
    process.exit(1);
  }

  console.info('Configuration loaded successfully');
  console.info(`  - Mode: ${config.useMockResponses ? 'MOCK' : 'LIVE'}`);
  console.info(`  - Port: ${config.port}`);
  console.info(`  - Node Environment: ${config.nodeEnv}`);
}
