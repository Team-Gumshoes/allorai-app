import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import type { AirportInfo } from "../../types/flight/flights.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const airports: AirportInfo[] = JSON.parse(
  readFileSync(join(__dirname, "../../data/airports/airports.json"), "utf-8"),
) as AirportInfo[];

/**
 * Validates an airport code against the local airports.json data file.
 * Throws if the airport code is not found.
 */
export async function validateAirportCode(
  keyword: string,
): Promise<AirportInfo> {
  const match = airports.find(
    (airport) => airport.iata_code?.toUpperCase() === keyword.toUpperCase(),
  );

  if (!match) {
    throw new Error("Invalid Airport");
  }

  return {
    name: match.name,
    iata_code: match.iata_code,
    latitude_deg: match.latitude_deg,
    longitude_deg: match.longitude_deg,
  };
}

export const validateAirport = tool(
  async ({ keyword }) => {
    try {
      const airportInfo = await validateAirportCode(keyword);
      return JSON.stringify(airportInfo);
    } catch {
      return JSON.stringify({ error: true, message: "Invalid Airport." });
    }
  },
  {
    name: "validateAirport",
    description: `
    Validates an airport code and returns its details.

    Use this tool to verify that an airport IATA code is valid before searching for flights.

    On success, returns:
    - name: Full airport name
    - iata_code: 3-letter IATA code
    - latitude_deg: Geographic latitude in degrees
    - longitude_deg: Geographic longitude in degrees

    On failure, returns an error indicating the airport is invalid.
    `,
    schema: z.object({
      keyword: z
        .string()
        .describe("The IATA airport code to validate (e.g., JFK, LAX, LHR)"),
    }),
  },
);
