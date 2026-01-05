import { useState } from 'react';
import { searchFlights as searchFlightsApi } from '../api/flights';

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
}

export function useFlights() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = async (searchParams: any) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchFlightsApi(searchParams);
      setFlights(results);
    } catch (err: any) {
      setError(err.message || 'Failed to search flights');
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    flights,
    loading,
    error,
    searchFlights,
  };
}
