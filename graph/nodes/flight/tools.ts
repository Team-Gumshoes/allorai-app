import { searchFlights } from "../../../tools/travel/searchFlights.js";

export const flightToolsByName = {
  searchFlights,
};

export type FlightToolName = keyof typeof flightToolsByName;

export const flightTools = Object.values(flightToolsByName);
