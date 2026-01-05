/**
 * Hotel-related types
 */

import type { Address, Coordinates } from './common.types';
import type { Price } from './flight.types';

/**
 * Hotel search request parameters
 */
export interface HotelSearchRequest {
  city: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  rooms?: number;
  minRating?: number;
  maxPrice?: number;
  amenities?: string[];
}

/**
 * Hotel search response
 */
export interface HotelSearchResponse {
  hotels: Hotel[];
  searchId: string;
  total: number;
}

/**
 * Hotel information
 */
export interface Hotel {
  id: string;
  name: string;
  description: string;
  address: Address;
  rating: number;
  starRating: number;
  price: Price;
  pricePerNight: Price;
  images: string[];
  amenities: string[];
  roomTypes: RoomType[];
  reviewCount: number;
  distance?: number;
  distanceUnit?: 'km' | 'miles';
}

/**
 * Room type information
 */
export interface RoomType {
  id: string;
  name: string;
  description: string;
  capacity: number;
  beds: BedConfiguration[];
  size: number;
  sizeUnit: 'sqm' | 'sqft';
  price: Price;
  amenities: string[];
  images: string[];
  available: boolean;
}

/**
 * Bed configuration
 */
export interface BedConfiguration {
  type: 'single' | 'double' | 'queen' | 'king';
  count: number;
}

/**
 * Hotel details (extended information)
 */
export interface HotelDetails extends Hotel {
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  childrenPolicy?: string;
  petPolicy?: string;
  parkingInfo?: string;
  facilities: Facility[];
  reviews: Review[];
  nearbyAttractions: NearbyAttraction[];
}

/**
 * Hotel facility
 */
export interface Facility {
  name: string;
  description: string;
  category: 'dining' | 'recreation' | 'business' | 'wellness' | 'other';
  icon?: string;
  available: boolean;
  additionalCost?: Price;
}

/**
 * Hotel review
 */
export interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  helpful: number;
}

/**
 * Nearby attraction
 */
export interface NearbyAttraction {
  name: string;
  type: string;
  distance: number;
  distanceUnit: 'km' | 'miles';
  coordinates?: Coordinates;
}
