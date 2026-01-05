import apiClient from '@/lib/api-client';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
}

export async function searchFlights(params: FlightSearchParams) {
  const response = await apiClient.post('/flights/search', params);
  return response.data;
}

export async function getFlightDetails(flightId: string) {
  const response = await apiClient.get(`/flights/${flightId}`);
  return response.data;
}

export async function bookFlight(flightId: string, passengerDetails: any) {
  const response = await apiClient.post(`/flights/${flightId}/book`, passengerDetails);
  return response.data;
}
