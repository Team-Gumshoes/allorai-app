import type { Trip } from "./trip.js";
import type { ArithmeticResult } from "./arithmetic/arithmetic.js";
import type { FlightResults } from "./flight/flights.js";
import type { HotelResults } from "./hotel/hotels.js";
import type { RestaurantResults } from "./restaurant/restaurants.js";
import type { SelfieSpots } from "./selfie/selfieSpots.js";
import type { Activities } from "./activities/activities.js";
import type { Nature } from "./nature/nature.js";
import type { Tips } from "./tips/tips.js";

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

export interface SelfieResponseData {
  type: "selfie";
  summary?: string;
  options?: SelfieSpots[];
}

export interface ActivitiesResponseData {
  type: "activities";
  summary?: string;
  options?: Activities[];
}

export interface NatureResponseData {
  type: "nature";
  summary?: string;
  options?: Nature[];
}

export interface TipsResponseData {
  type: "tips";
  summary?: string;
  options?: Tips[];
}

export type ResponseData =
  | ArithmeticResponseData
  | FlightResponseData
  | HotelResponseData
  | NatureResponseData
  | RestaurantResponseData
  | SelfieResponseData
  | ActivitiesResponseData
  | TipsResponseData;

export interface ChatRequest {
  messages: Message[];
  data?: ResponseData | null;
  trip: Trip;
}

export interface ChatResponse {
  messages: Message[];
  data: ResponseData | null;
  trip: Trip;
}

export interface TipsRequest {
  data?: ResponseData | null;
  trip: Trip;
}

export interface TipsResponse {
  data: ResponseData | null;
  trip: Trip;
}
