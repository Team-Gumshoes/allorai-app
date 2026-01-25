import { extractLastToolJson } from "../../../utils/agents/extractLastToolJson.js";
import type { FlightResults } from "../../../types/flights.js";
import { BaseMessage } from "@langchain/core/messages";

export function formatFlights(messages: BaseMessage[]): string {
  const flights = extractLastToolJson<FlightResults[]>(messages);

  if (!flights || !Array.isArray(flights) || flights.length === 0) {
    return "No flights found.";
  }

  return flights
    .slice(0, 5) // show top N results
    .map((flight, flightIndex) => {
      const header = `
${flightIndex + 1}. Price: ${flight.price} ${flight.currency}
`.trim();

      const legsText = flight.legs
        .map((leg) => {
          const segmentsText = leg.segments
            .map((segment, segmentIndex) => {
              return `
    Segment ${segmentIndex + 1}:
      Airline: ${segment.airline}
      Duration: ${segment.duration}
      Departure: ${segment.departure.airport} at ${segment.departure.time}
      Arrival: ${segment.arrival.airport} at ${segment.arrival.time}
              `.trim();
            })
            .join("\n");

          return `
  ${leg.direction.toUpperCase()} LEG
  Total Leg Duration: ${leg.legDuration}

${segmentsText}
          `.trim();
        })
        .join("\n\n");

      return `${header}\n${legsText}`;
    })
    .join("\n\n--------------------------------\n\n");
}
