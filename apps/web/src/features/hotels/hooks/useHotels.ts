import { useState } from 'react';
import { searchHotels as searchHotelsApi } from '../api/hotels';

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  currency: string;
  imageUrl?: string;
  amenities: string[];
}

export function useHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchHotels = async (searchParams: any) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchHotelsApi(searchParams);
      setHotels(results);
    } catch (err: any) {
      setError(err.message || 'Failed to search hotels');
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    hotels,
    loading,
    error,
    searchHotels,
  };
}
