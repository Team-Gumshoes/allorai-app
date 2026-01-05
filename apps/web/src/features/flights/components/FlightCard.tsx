import { Plane, Clock, Calendar } from 'lucide-react';

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

interface FlightCardProps {
  flight: Flight;
}

export default function FlightCard({ flight }: FlightCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <Plane className="h-6 w-6 text-primary-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{flight.airline}</h3>
              <p className="text-sm text-gray-600">{flight.flightNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Departure</p>
              <p className="font-semibold text-gray-900">{flight.departureTime}</p>
              <p className="text-sm text-gray-600">{flight.origin}</p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900">{flight.duration}</p>
              </div>
              <p className="text-sm text-gray-600">
                {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Arrival</p>
              <p className="font-semibold text-gray-900">{flight.arrivalTime}</p>
              <p className="text-sm text-gray-600">{flight.destination}</p>
            </div>
          </div>
        </div>

        <div className="md:text-right md:border-l md:pl-6">
          <p className="text-2xl font-bold text-primary-600">
            {flight.currency} {flight.price.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mb-4">per person</p>
          <button className="w-full md:w-auto px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
