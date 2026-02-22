import { searchFlights } from "../../../tools/travel/searchFlights.js";
import { validateAirport } from "../../../tools/travel/validateAirport.js";

export const flightToolsByName = {
  validateAirport,
  searchFlights,
};

export type FlightToolName = keyof typeof flightToolsByName;

export const flightTools = Object.values(flightToolsByName);
