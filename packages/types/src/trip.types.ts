/**
 * Trip planning and itinerary types
 */

import type { Flight } from './flight.types';
import type { Hotel } from './hotel.types';
import type { TransportOption } from './transport.types';

/**
 * Complete trip information
 */
export interface Trip {
  id: string;
  userId?: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget?: number;
  currency?: string;
  status: TripStatus;
  itinerary: Itinerary;
  preferences?: TravelPreferences;
  createdAt: string;
  updatedAt: string;
}

/**
 * Trip status
 */
export enum TripStatus {
  PLANNING = 'planning',
  BOOKED = 'booked',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Travel itinerary
 */
export interface Itinerary {
  segments: TripSegment[];
  totalCost: number;
  currency: string;
  summary?: string;
}

/**
 * Trip segment (day or activity)
 */
export interface TripSegment {
  id: string;
  day: number;
  date: string;
  activities: Activity[];
  accommodation?: Hotel;
  transportation?: TransportOption[];
  notes?: string;
}

/**
 * Activity in itinerary
 */
export interface Activity {
  id: string;
  type: ActivityType;
  name: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  location: string;
  cost?: number;
  currency?: string;
  booking?: BookingInfo;
  notes?: string;
}

/**
 * Activity type
 */
export enum ActivityType {
  SIGHTSEEING = 'sightseeing',
  DINING = 'dining',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  RELAXATION = 'relaxation',
  ADVENTURE = 'adventure',
  CULTURAL = 'cultural',
  TRANSPORT = 'transport',
  OTHER = 'other',
}

/**
 * Booking information
 */
export interface BookingInfo {
  bookingId: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  confirmationNumber?: string;
  provider: string;
  bookingUrl?: string;
}

/**
 * Travel preferences
 */
export interface TravelPreferences {
  accommodation?: {
    type?: 'hotel' | 'hostel' | 'apartment' | 'resort';
    minRating?: number;
    amenities?: string[];
  };
  dining?: {
    cuisinePreferences?: string[];
    dietaryRestrictions?: string[];
    priceRange?: 'budget' | 'moderate' | 'upscale' | 'luxury';
  };
  activities?: {
    interests?: string[];
    pacePreference?: 'relaxed' | 'moderate' | 'packed';
    accessibility?: boolean;
  };
  transportation?: {
    preferredModes?: string[];
    comfortLevel?: 'economy' | 'comfort' | 'luxury';
  };
}

/**
 * Trip planning request
 */
export interface TripPlanRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget?: number;
  currency?: string;
  preferences?: TravelPreferences;
  query?: string;
}

/**
 * Trip planning response
 */
export interface TripPlanResponse {
  trip: Trip;
  alternatives?: Trip[];
  recommendations?: string[];
}
