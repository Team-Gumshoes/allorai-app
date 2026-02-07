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

export interface FlightResults {
  // totalDuration: string;
  price: number;
  currency: string;
  legs: FlightLeg[];
}
