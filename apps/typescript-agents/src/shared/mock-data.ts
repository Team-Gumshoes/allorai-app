/**
 * Mock data generators for testing and development
 * These functions return realistic sample data when USE_MOCK_RESPONSES=true
 */

export interface MockFlight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  availableSeats: number;
  class: string;
}

export interface MockFlightDetails extends MockFlight {
  aircraft: string;
  stops: number;
  amenities: string[];
  baggageAllowance: {
    checkedBags: number;
    carryOn: number;
    maxWeight: string;
  };
}

/**
 * Generate mock flight search results
 */
export function generateMockFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  passengers?: number;
  class?: string;
}): MockFlight[] {
  const { origin, destination, departureDate } = params;

  // Generate 3-5 mock flights
  const numFlights = Math.floor(Math.random() * 3) + 3;
  const flights: MockFlight[] = [];

  const airlines = ['United Airlines', 'Delta', 'American Airlines', 'Southwest', 'JetBlue'];
  const classes = ['Economy', 'Premium Economy', 'Business', 'First Class'];

  for (let i = 0; i < numFlights; i++) {
    const departureHour = 6 + i * 3; // Spread flights throughout the day
    const durationHours = 2 + Math.floor(Math.random() * 4);
    const arrivalHour = (departureHour + durationHours) % 24;

    const basePrice = 150 + Math.floor(Math.random() * 500);
    const priceVariation = Math.floor(Math.random() * 100) - 50;

    flights.push({
      id: `FL${Date.now()}-${i}`,
      airline: airlines[i % airlines.length],
      flightNumber: `${['UA', 'DL', 'AA', 'WN', 'B6'][i % 5]}${1000 + i * 100}`,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureTime: `${departureDate}T${departureHour.toString().padStart(2, '0')}:00:00`,
      arrivalTime: `${departureDate}T${arrivalHour.toString().padStart(2, '0')}:00:00`,
      duration: `${durationHours}h ${Math.floor(Math.random() * 60)}m`,
      price: basePrice + priceVariation,
      currency: 'USD',
      availableSeats: Math.floor(Math.random() * 50) + 10,
      class: params.class || classes[i % classes.length],
    });
  }

  return flights;
}

/**
 * Generate mock flight details for a specific flight
 */
export function generateMockFlightDetails(flightId: string): MockFlightDetails {
  const baseFlights = generateMockFlights({
    origin: 'JFK',
    destination: 'LAX',
    departureDate: '2024-03-15',
  });

  const baseFlight = baseFlights[0];

  return {
    ...baseFlight,
    id: flightId,
    aircraft: 'Boeing 737-800',
    stops: Math.floor(Math.random() * 2), // 0 or 1 stop
    amenities: [
      'WiFi',
      'In-flight entertainment',
      'Power outlets',
      'Complimentary snacks',
      'Beverages',
    ],
    baggageAllowance: {
      checkedBags: 2,
      carryOn: 1,
      maxWeight: '50 lbs per bag',
    },
  };
}

/**
 * Mock hotel search results (for coordinator agent)
 */
export interface MockHotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  pricePerNight: number;
  currency: string;
  amenities: string[];
  availableRooms: number;
}

export function generateMockHotels(params: {
  location: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
}): MockHotel[] {
  const { location } = params;

  const hotelNames = [
    'Grand Hyatt',
    'Marriott Marquis',
    'Hilton Downtown',
    'Four Seasons',
    'Sheraton Plaza',
  ];

  return hotelNames.map((name, i) => ({
    id: `HOTEL${Date.now()}-${i}`,
    name: `${name} ${location}`,
    location: location,
    rating: 3.5 + Math.random() * 1.5,
    pricePerNight: 100 + i * 50 + Math.floor(Math.random() * 50),
    currency: 'USD',
    amenities: [
      'Free WiFi',
      'Pool',
      'Fitness Center',
      'Restaurant',
      'Room Service',
    ].slice(0, 3 + Math.floor(Math.random() * 3)),
    availableRooms: Math.floor(Math.random() * 20) + 5,
  }));
}

/**
 * Generate mock API error response
 */
export function generateMockError(message: string = 'Mock error occurred'): Error {
  return new Error(`[MOCK ERROR] ${message}`);
}

/**
 * Simulate API delay for more realistic mock responses
 */
export async function simulateApiDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}
