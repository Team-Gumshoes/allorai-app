/**
 * Flight-related types
 */

/**
 * Flight search request parameters
 */
export interface FlightSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  class?: FlightClass;
  maxPrice?: number;
  directOnly?: boolean;
}

/**
 * Flight class/cabin type
 */
export enum FlightClass {
  ECONOMY = 'economy',
  PREMIUM_ECONOMY = 'premium_economy',
  BUSINESS = 'business',
  FIRST = 'first',
}

/**
 * Flight search response
 */
export interface FlightSearchResponse {
  flights: Flight[];
  searchId: string;
  total: number;
}

/**
 * Flight information
 */
export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: Price;
  class: FlightClass;
  stops: number;
  aircraft?: string;
  amenities?: string[];
  availableSeats?: number;
}

/**
 * Airport information
 */
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  terminal?: string;
  gate?: string;
}

/**
 * Price information
 */
export interface Price {
  amount: number;
  currency: string;
  displayPrice?: string;
}

/**
 * Flight details (extended information)
 */
export interface FlightDetails extends Flight {
  baggage: BaggageInfo;
  cancellationPolicy: string;
  changePolicy: string;
  amenitiesDetails: AmenityDetails[];
  segments: FlightSegment[];
}

/**
 * Baggage allowance information
 */
export interface BaggageInfo {
  carry: {
    pieces: number;
    weight: number;
    weightUnit: 'kg' | 'lbs';
  };
  checked: {
    pieces: number;
    weight: number;
    weightUnit: 'kg' | 'lbs';
  };
}

/**
 * Amenity details
 */
export interface AmenityDetails {
  name: string;
  description: string;
  icon?: string;
  available: boolean;
}

/**
 * Flight segment (for multi-leg flights)
 */
export interface FlightSegment {
  segmentNumber: number;
  airline: string;
  flightNumber: string;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  aircraft: string;
}
