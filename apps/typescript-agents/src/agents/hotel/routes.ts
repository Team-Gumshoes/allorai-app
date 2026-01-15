/**
 * Express routes for Hotel Agent.
 * Exposes HTTP endpoints for hotel search operations.
 */

import { Router, Request, Response } from 'express';
import { config } from '../../shared/config.js';
import { generateMockHotels, simulateApiDelay } from '../../shared/mock-data.js';

export const hotelRouter: Router = Router();

interface HotelSearchRequest {
  query?: string;
  location: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  rooms?: number;
}

interface HotelSearchResponse {
  success: boolean;
  query: string;
  data?: unknown;
  error?: string;
  agent: string;
}

/**
 * POST /api/v1/hotel/search
 * Search for hotels using query parameters
 */
hotelRouter.post('/hotel/search', async (req: Request, res: Response) => {
  try {
    const body = req.body as HotelSearchRequest;

    console.log('Received hotel search request:', body);

    // Validate required fields
    if (!body.location || !body.checkIn || !body.checkOut) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: location, checkIn, checkOut',
        agent: 'hotel',
      });
      return;
    }

    // Simulate API delay for realistic behavior
    if (config.useMockResponses) {
      await simulateApiDelay(200, 800);
    }

    // Generate mock hotels or call real API
    const hotels = generateMockHotels({
      location: body.location,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      guests: body.guests,
    });

    // Calculate number of nights
    const checkInDate = new Date(body.checkIn);
    const checkOutDate = new Date(body.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    const response: HotelSearchResponse = {
      success: true,
      query: body.query || `Hotels in ${body.location} from ${body.checkIn} to ${body.checkOut}`,
      data: {
        hotels,
        searchParams: {
          location: body.location,
          checkIn: body.checkIn,
          checkOut: body.checkOut,
          guests: body.guests || 2,
          rooms: body.rooms || 1,
          nights,
        },
        totalResults: hotels.length,
      },
      agent: 'hotel',
    };

    res.json(response);
  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      agent: 'hotel',
    });
  }
});

/**
 * GET /api/v1/hotel/:id
 * Get details for a specific hotel
 */
hotelRouter.get('/hotel/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('Received hotel details request for:', id);

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Hotel ID is required',
        agent: 'hotel',
      });
      return;
    }

    // Simulate API delay
    if (config.useMockResponses) {
      await simulateApiDelay(100, 300);
    }

    // Generate mock hotel details
    const hotelDetails = {
      id,
      name: 'Grand Hyatt Mock Hotel',
      location: 'New York City',
      address: '123 Park Avenue, New York, NY 10001',
      rating: 4.5,
      pricePerNight: 250,
      currency: 'USD',
      amenities: [
        'Free WiFi',
        'Pool',
        'Fitness Center',
        'Restaurant',
        'Room Service',
        'Spa',
        'Business Center',
        'Concierge',
      ],
      roomTypes: [
        { type: 'Standard', price: 250, available: 10 },
        { type: 'Deluxe', price: 350, available: 5 },
        { type: 'Suite', price: 500, available: 2 },
      ],
      images: [
        'https://example.com/hotel/exterior.jpg',
        'https://example.com/hotel/lobby.jpg',
        'https://example.com/hotel/room.jpg',
      ],
      reviews: {
        averageRating: 4.5,
        totalReviews: 1250,
        breakdown: {
          cleanliness: 4.6,
          comfort: 4.5,
          location: 4.8,
          facilities: 4.4,
          staff: 4.7,
        },
      },
    };

    res.json({
      success: true,
      data: hotelDetails,
      agent: 'hotel',
    });
  } catch (error) {
    console.error('Hotel details error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      agent: 'hotel',
    });
  }
});

/**
 * GET /api/v1/hotel/health
 * Health check endpoint for hotel agent
 */
hotelRouter.get('/hotel/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    agent: 'hotel',
    service: 'typescript-agents',
    mock_mode: config.useMockResponses,
  });
});
