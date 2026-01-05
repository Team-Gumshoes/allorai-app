import { Router, Request, Response, NextFunction } from 'express';
import { pythonAgentsClient } from '../services/pythonAgentsClient.js';

const router = Router();

/**
 * Transport routes - Proxies to python-agents:8000/transport/*
 */

// Search transport options
router.post('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await pythonAgentsClient.post('/transport/search', req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get transport details
router.get('/:transportId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transportId } = req.params;
    const response = await pythonAgentsClient.get(`/transport/${transportId}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Book transport
router.post('/book', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await pythonAgentsClient.post('/transport/book', req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Cancel transport booking
router.delete('/bookings/:bookingId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.params;
    const response = await pythonAgentsClient.delete(`/transport/bookings/${bookingId}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get available vehicle types
router.get('/vehicles/types', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await pythonAgentsClient.get('/transport/vehicles/types');
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;
