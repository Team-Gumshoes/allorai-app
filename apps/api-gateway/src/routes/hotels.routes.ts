import { Router, Request, Response, NextFunction } from 'express';
import { pythonAgentsClient } from '../services/pythonAgentsClient.js';

const router = Router();

/**
 * Hotel routes - Proxies to python-agents:8000/hotel/*
 */

// Search hotels
router.post('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await pythonAgentsClient.post('/hotel/search', req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get hotel details
router.get('/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = req.params;
    const response = await pythonAgentsClient.get(`/hotel/${hotelId}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get room availability
router.get('/:hotelId/rooms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = req.params;
    const response = await pythonAgentsClient.get(`/hotel/${hotelId}/rooms`, req.query);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Book hotel room
router.post('/book', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await pythonAgentsClient.post('/hotel/book', req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Cancel hotel booking
router.delete('/bookings/:bookingId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.params;
    const response = await pythonAgentsClient.delete(`/hotel/bookings/${bookingId}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;
