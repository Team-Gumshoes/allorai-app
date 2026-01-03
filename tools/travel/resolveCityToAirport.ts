import { tool } from "@langchain/core/tools";
import * as z from "zod";

/**
 * Currently Unused
 *
 * In order to correctly identify airport codes without relying on an LLM, another
 * API should be used which returns an Airport Code given a City Name.
 *
 * For now, the LLM will infer the airport code from the city name.
 */
export const resolveCityToAirport = tool(({ city }) => city, {
  name: "findCheapestFlights",
  description: `
    The user may provide city names or airport codes.
    If a city name is provided, infer the most likely international airport.
    If an airport code is provided, return the airport code.
  `,
  schema: z.object({
    city: z.string().describe("The city name or airport code"),
  }),
});
