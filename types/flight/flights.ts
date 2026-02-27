export interface FlightSegment {
  duration: string;
  departure: {
    airport: string;
    time: string;
  };
  arrival: {
    airport: string;
    time: string;
  };
  airline: string;
}

export interface FlightLeg {
  direction: "outbound" | "return";
  legDuration: string;
  segments: FlightSegment[];
}

export interface AirportInfo {
  name: string;
  iata_code: string;
  latitude_deg: number;
  longitude_deg: number;
}

export interface CityInfo {
  name: string;
  latitude: number;
  longitude: number;
}

export interface FlightResults {
  id: string;
  price: number;
  currency: string;
  legs: FlightLeg[];
  destinationAirport: AirportInfo;
  destinationCity: CityInfo | null;
}
