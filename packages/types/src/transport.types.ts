/**
 * Transport-related types
 */

import type { Price } from './flight.types';
import type { Coordinates } from './common.types';

/**
 * Transport type enumeration
 */
export enum TransportType {
  CAR_RENTAL = 'car_rental',
  TRAIN = 'train',
  BUS = 'bus',
  TAXI = 'taxi',
  RIDESHARE = 'rideshare',
  METRO = 'metro',
  FERRY = 'ferry',
}

/**
 * Transport search request
 */
export interface TransportSearchRequest {
  type: TransportType;
  origin: string;
  destination: string;
  date: string;
  passengers?: number;
  returnDate?: string;
}

/**
 * Transport search response
 */
export interface TransportSearchResponse {
  options: TransportOption[];
  searchId: string;
  total: number;
}

/**
 * Transport option
 */
export interface TransportOption {
  id: string;
  type: TransportType;
  provider: string;
  origin: Location;
  destination: Location;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: Price;
  capacity?: number;
  availableSeats?: number;
  amenities?: string[];
}

/**
 * Location information
 */
export interface Location {
  name: string;
  address?: string;
  city: string;
  country?: string;
  coordinates?: Coordinates;
  type?: 'station' | 'stop' | 'terminal' | 'address';
}

/**
 * Car rental specific information
 */
export interface CarRental extends TransportOption {
  type: TransportType.CAR_RENTAL;
  vehicle: Vehicle;
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupTime: string;
  dropoffTime: string;
  mileageLimit?: number;
  mileageUnit?: 'km' | 'miles';
  insurance: InsuranceOption[];
}

/**
 * Vehicle information
 */
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  transmission: 'automatic' | 'manual';
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  seats: number;
  doors: number;
  luggage: number;
  features: string[];
  image?: string;
}

/**
 * Vehicle category
 */
export enum VehicleCategory {
  ECONOMY = 'economy',
  COMPACT = 'compact',
  MIDSIZE = 'midsize',
  FULLSIZE = 'fullsize',
  SUV = 'suv',
  LUXURY = 'luxury',
  VAN = 'van',
}

/**
 * Insurance option
 */
export interface InsuranceOption {
  id: string;
  name: string;
  description: string;
  coverage: string[];
  price: Price;
  recommended: boolean;
}

/**
 * Train/Bus specific information
 */
export interface PublicTransport extends TransportOption {
  type: TransportType.TRAIN | TransportType.BUS;
  routeNumber?: string;
  stops: Location[];
  class?: 'economy' | 'business' | 'first';
  wifi?: boolean;
  powerOutlets?: boolean;
}
