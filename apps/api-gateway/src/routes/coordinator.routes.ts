import { Router, Request, Response, NextFunction } from 'express';
import { pythonAgentsClient } from '../services/pythonAgentsClient.js';
// NOTE: This currently uses the Python coordinator agent.
// A TypeScript implementation could be created and used via typescriptAgentsClient instead.

const router = Router();

/**
 * Coordinator routes - Proxies to python-agents:8000/coordinate
 * NOTE: Could be migrated to TypeScript agents if a TS coordinator is implemented
 */

// Coordinate a complete travel plan
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await pythonAgentsClient.post('/coordinate', req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get coordination status
router.get('/status/:coordinationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { coordinationId } = req.params;
    const response = await pythonAgentsClient.get(`/coordinate/status/${coordinationId}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Cancel coordination
router.delete('/:coordinationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { coordinationId } = req.params;
    const response = await pythonAgentsClient.delete(`/coordinate/${coordinationId}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;
