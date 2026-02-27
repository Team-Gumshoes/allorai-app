export interface Trip {
  origin: string | null;
  destination: string | null;
  city: string | null;
  departureFlight: string | null;
  returnFlight: string | null;
  departureDate: string | null;
  returnDate: string | null;
  budget: number | null;
  hotel: string | null;
  interests: string[];
  constraints: string[];
  destinationCoords: { latitude: number; longitude: number } | null;
  hotelCoords: { latitude: number; longitude: number } | null;
}

export function createEmptyTrip(): Trip {
  return {
    origin: null,
    destination: null,
    city: null,
    departureFlight: null,
    returnFlight: null,
    departureDate: null,
    returnDate: null,
    budget: null,
    hotel: null,
    interests: [],
    constraints: [],
    destinationCoords: null,
    hotelCoords: null,
  };
}
