import { useState } from 'react';
import { Search, Plane, Calendar } from 'lucide-react';
import { useFlights } from './hooks/useFlights';
import FlightCard from './components/FlightCard';
import FlightSearchForm from './components/FlightSearchForm';

export default function FlightsPage() {
  const { flights, loading, error, searchFlights } = useFlights();
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchParams: any) => {
    setHasSearched(true);
    await searchFlights(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Plane className="h-8 w-8 text-primary-600" />
          Search Flights
        </h1>
        <p className="mt-2 text-gray-600">
          Find the best flights for your next adventure
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <FlightSearchForm onSearch={handleSearch} loading={loading} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {!loading && hasSearched && flights.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No flights found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}

      {!loading && flights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Found {flights.length} flights
          </h2>
          {flights.map((flight) => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
}
