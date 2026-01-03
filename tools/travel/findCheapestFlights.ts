import "dotenv/config";
import { tool } from "@langchain/core/tools";
import * as z from "zod";
import type {
  FlightResults,
  FlightLeg,
  FlightSegment,
} from "../../types/flights.js";

/**
 * IMPORTANT:
 * - Tool returns structured data
 * - Tool NEVER formats for humans
 * - Tool NEVER reasons
 */

export const findCheapestFlights = tool(
  async ({
    originLocationCode,
    destinationLocationCode,
    departureDate,
    returnDate,
  }) => {
    const token = process.env.AMADEUS_API_TOKEN;

    if (!token) {
      throw new Error("Missing FLIGHT_API_TOKEN");
    }

    const url = new URL(
      "https://test.api.amadeus.com/v2/shopping/flight-offers"
    );
    url.searchParams.set("originLocationCode", originLocationCode);
    url.searchParams.set("destinationLocationCode", destinationLocationCode);
    url.searchParams.set("departureDate", departureDate);
    url.searchParams.set("returnDate", returnDate);
    url.searchParams.set("max", String(5)); // Set a default of 5 results
    url.searchParams.set("currencyCode", "USD");
    url.searchParams.set("adults", String(1));

    // console.log(url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Flight API error: ${response.status} ${response.statusText} ${text}`
      );
    }

    const rawData = await response.json();
    const dictionary = rawData.dictionaries; // Contains the mapping between codes and real names
    const carrierMap = dictionary?.carriers ?? [];

    // Shape the results
    const allFlightResults: FlightResults[] = [];

    // Loop through the offers
    for (const offer of rawData.data) {
      const flightResults: FlightResults = {
        price: 0,
        currency: "",
        legs: [],
      };

      // const duration = offer.duration;
      const currency = offer.price.currency;
      const price = offer.price.total;

      // flightResults.duration = duration;
      flightResults.price = price;
      flightResults.currency = currency;

      // Get outbound itinerary
      const outboundItinerary = offer.itineraries[0];

      // Outbound Itinerary
      const outboundLeg: FlightLeg = {
        direction: "outbound",
        legDuration: outboundItinerary.duration,
        segments: [],
      };
      // Loop through the segments of the leg
      for (const flight of outboundItinerary.segments) {
        const duration = flight.duration;
        const departure = flight.departure;
        const arrival = flight.arrival;
        const carrierCode = flight.carrierCode;

        const airlineName = carrierMap[carrierCode] ?? carrierCode;

        const flightSegment: FlightSegment = {
          duration: duration,
          departure: {
            airport: departure.iataCode,
            time: departure.at,
          },
          arrival: {
            airport: arrival.iataCode,
            time: arrival.at,
          },
          airline: airlineName,
        };

        outboundLeg.segments.push(flightSegment);
      }
      flightResults.legs.push(outboundLeg); // Add the outbound leg
      allFlightResults.push(flightResults); // Add the result

      // Get return itinerary
      const returnItinerary = offer.itineraries[1];

      // Outbound Itinerary
      const returnLeg: FlightLeg = {
        direction: "return",
        legDuration: returnItinerary.duration,
        segments: [],
      };
      // Loop through the segments of the leg
      for (const flight of returnItinerary.segments) {
        const duration = flight.duration;
        const departure = flight.departure;
        const arrival = flight.arrival;
        const carrierCode = flight.carrierCode;

        const airlineName = carrierMap[carrierCode] ?? carrierCode;

        const flightSegment: FlightSegment = {
          duration: duration,
          departure: {
            airport: departure.iataCode,
            time: departure.at,
          },
          arrival: {
            airport: arrival.iataCode,
            time: arrival.at,
          },
          airline: airlineName,
        };

        returnLeg.segments.push(flightSegment);
      }
      flightResults.legs.push(returnLeg); // Add the outbound leg
      allFlightResults.push(flightResults); // Add the result
    }

    // console.log(JSON.stringify(allFlightResults, null, 2));
    return JSON.stringify(allFlightResults); // Tool must always return a string
  },
  {
    name: "findCheapestFlights",
    description: `
    Finds the cheapest available round-trip flights.

    Use this tool ONLY when the user asks about flights,
    airfare prices, or flight recommendations.

    You MUST provide valid IATA airport codes (e.g. "JFK", "LAX").
    Dates must be in YYYY-MM-DD format.
    `,
    schema: z.object({
      originLocationCode: z
        .string()
        .length(3)
        .describe("IATA airport code for departure (e.g. JFK)"),
      destinationLocationCode: z
        .string()
        .length(3)
        .describe("IATA airport code for destination (e.g. LAX)"),
      departureDate: z.string().describe("Departure date in YYYY-MM-DD format"),
      returnDate: z.string().describe("Return date in YYYY-MM-DD format"),
      // max: z
      //   .number()
      //   .min(1)
      //   .max(20)
      //   .default(5)
      //   .describe("Maximum number of flight results"),
    }),
  }
);
