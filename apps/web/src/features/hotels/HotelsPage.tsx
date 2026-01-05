import { useState } from 'react';
import { Search, Hotel, MapPin } from 'lucide-react';
import { useHotels } from './hooks/useHotels';
import HotelCard from './components/HotelCard';
import HotelSearchForm from './components/HotelSearchForm';

export default function HotelsPage() {
  const { hotels, loading, error, searchHotels } = useHotels();
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchParams: any) => {
    setHasSearched(true);
    await searchHotels(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Hotel className="h-8 w-8 text-primary-600" />
          Search Hotels
        </h1>
        <p className="mt-2 text-gray-600">
          Find the perfect accommodation for your stay
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <HotelSearchForm onSearch={handleSearch} loading={loading} />
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

      {!loading && hasSearched && hotels.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hotels found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}

      {!loading && hotels.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Found {hotels.length} hotels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
