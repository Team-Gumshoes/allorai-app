import { Router, Request, Response, NextFunction } from 'express';
import { typescriptAgentsClient } from '../services/typescriptAgentsClient.js';

const router = Router();

/**
 * Flight routes - Proxies to typescript-agents:3002/flight/*
 */

// Search flights
router.post('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await typescriptAgentsClient.post('/flight/search', req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get flight details
router.get('/:flightId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { flightId } = req.params;
    const response = await typescriptAgentsClient.get(`/flight/${flightId}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Book flight
router.post('/book', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await typescriptAgentsClient.post('/flight/book', req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Cancel flight booking
router.delete('/bookings/:bookingId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.params;
    const response = await typescriptAgentsClient.delete(`/flight/bookings/${bookingId}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;
