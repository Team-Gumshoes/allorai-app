import type { Trip } from "./trip.js";
import type { ArithmeticResult } from "./arithmetic/arithmetic.js";
import type { FlightResults } from "./flight/flights.js";
import type { RestaurantResults } from "./restaurant/restaurants.js";

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

export interface RestaurantResponseData {
  type: "restaurant";
  summary?: string;
  options?: RestaurantResults[];
}

export type ResponseData =
  | ArithmeticResponseData
  | FlightResponseData
  | RestaurantResponseData;

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
