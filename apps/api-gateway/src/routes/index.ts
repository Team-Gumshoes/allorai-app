import { Router } from 'express';
import flightsRouter from './flights.routes.js';
import hotelsRouter from './hotels.routes.js';
import transportRouter from './transport.routes.js';
import coordinatorRouter from './coordinator.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use('/flights', flightsRouter);
router.use('/hotels', hotelsRouter);
router.use('/transport', transportRouter);
router.use('/coordinate', coordinatorRouter);

export default router;
