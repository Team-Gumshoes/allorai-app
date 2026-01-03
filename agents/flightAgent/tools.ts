import { findCheapestFlights } from "../../tools/travel/findCheapestFlights.js";

export const flightToolsByName = {
  findCheapestFlights,
};

export type FlightToolName = keyof typeof flightToolsByName;

export const flightTools = Object.values(flightToolsByName);
