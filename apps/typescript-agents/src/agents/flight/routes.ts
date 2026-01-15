/**
 * Express routes for Flight Agent.
 * Exposes HTTP endpoints for flight search operations.
 */

import { Router, Request, Response } from "express";
import { config } from "../../shared/config.js";
import {
  generateMockFlights,
  generateMockFlightDetails,
  simulateApiDelay,
} from "../../shared/mock-data.js";

export const flightRouter: Router = Router();

interface FlightSearchRequest {
  query?: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  class?: string;
}

interface FlightSearchResponse {
  success: boolean;
  query: string;
  data?: unknown;
  error?: string;
  agent: string;
}

/**
 * POST /api/v1/flight/search
 * Search for flights using query parameters
 */
flightRouter.post("/flight/search", async (req: Request, res: Response) => {
  try {
    const body = req.body as FlightSearchRequest;

    console.log("Received flight search request:", body);

    // Validate required fields
    if (!body.origin || !body.destination || !body.departureDate) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: origin, destination, departureDate",
        agent: "flight",
      });
      return;
    }

    // Simulate API delay for realistic behavior
    if (config.useMockResponses) {
      await simulateApiDelay(200, 800);
    }

    // Generate mock flights or call real API
    const flights = generateMockFlights({
      origin: body.origin,
      destination: body.destination,
      departureDate: body.departureDate,
      passengers: body.passengers,
      class: body.class,
    });

    const response: FlightSearchResponse = {
      success: true,
      query:
        body.query ||
        `Flights from ${body.origin} to ${body.destination} on ${body.departureDate}`,
      data: {
        flights,
        searchParams: {
          origin: body.origin,
          destination: body.destination,
          departureDate: body.departureDate,
          returnDate: body.returnDate,
          passengers: body.passengers || 1,
          class: body.class || "Economy",
        },
        totalResults: flights.length,
      },
      agent: "flight",
    };

    res.json(response);
  } catch (error) {
    console.error("Flight search error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      agent: "flight",
    });
  }
});

/**
 * GET /api/v1/flight/:id
 * Get details for a specific flight
 */
flightRouter.get("/flight/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log("Received flight details request for:", id);

    if (!id) {
      res.status(400).json({
        success: false,
        error: "Flight ID is required",
        agent: "flight",
      });
      return;
    }

    // Simulate API delay
    if (config.useMockResponses) {
      await simulateApiDelay(100, 300);
    }

    const flightDetails = generateMockFlightDetails(id);

    res.json({
      success: true,
      data: flightDetails,
      agent: "flight",
    });
  } catch (error) {
    console.error("Flight details error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      agent: "flight",
    });
  }
});

/**
 * GET /api/v1/flight/health
 * Health check endpoint for flight agent
 */
flightRouter.get("/flight/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    agent: "flight",
    service: "typescript-agents",
    mock_mode: config.useMockResponses,
  });
});
