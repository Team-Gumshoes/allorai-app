import { MapPin, Star, Wifi, Coffee, Car } from 'lucide-react';

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

interface HotelCardProps {
  hotel: Hotel;
}

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  breakfast: Coffee,
  parking: Car,
};

export default function HotelCard({ hotel }: HotelCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-48 bg-linear-to-br from-primary-100 to-primary-200 flex items-center justify-center">
        {hotel.imageUrl ? (
          <img src={hotel.imageUrl} alt={hotel.name} className="w-full h-full object-cover" />
        ) : (
          <MapPin className="h-16 w-16 text-primary-600" />
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{hotel.name}</h3>
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{hotel.location}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-gray-900">{hotel.rating}</span>
          </div>
          <span className="text-sm text-gray-600">({hotel.reviews} reviews)</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {hotel.amenities.slice(0, 3).map((amenity) => {
            const Icon = amenityIcons[amenity.toLowerCase()] || Coffee;
            return (
              <div
                key={amenity}
                className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-sm"
              >
                <Icon className="h-3 w-3" />
                <span>{amenity}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-600">From</p>
            <p className="text-xl font-bold text-primary-600">
              {hotel.currency} {hotel.price}
            </p>
            <p className="text-xs text-gray-600">per night</p>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            View
          </button>
        </div>
      </div>
    </div>
  );
}
