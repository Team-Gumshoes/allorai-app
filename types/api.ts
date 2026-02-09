import type { Trip } from "./trip.js";
import type { ArithmeticResult } from "./arithmetic/arithmetic.js";
import type { FlightResults } from "./flight/flights.js";
import type { HotelResults } from "./hotel/hotels.js";
import type { RestaurantResults } from "./restaurant/restaurants.js";
import type { Sights } from "./sightseeing/sights.js";

export interface Message {
  type: "human" | "ai";
  content: string;
}

export interface ArithmeticResponseData {
  type: "arithmetic";
  summary?: string;
  options?: ArithmeticResult;
}

export interface FlightResponseData {
  type: "flight";
  summary?: string;
  options?: FlightResults[];
}

export interface HotelResponseData {
  type: "hotel";
  summary?: string;
  options?: HotelResults[];
}

export interface RestaurantResponseData {
  type: "restaurant";
  summary?: string;
  options?: RestaurantResults[];
}

export interface SightseeingResponseData {
  type: "sightseeing";
  summary?: string;
  options?: Sights[];
}

export type ResponseData =
  | ArithmeticResponseData
  | FlightResponseData
  | HotelResponseData
  | RestaurantResponseData
  | SightseeingResponseData;

export interface ChatRequest {
  messages: Message[];
  data?: ResponseData | null;
  trip: Trip;
}

export interface ChatResponse {
  messages: Message[];
  data: ResponseData | null;
  trip: Trip;
  debug: Message[];
}
