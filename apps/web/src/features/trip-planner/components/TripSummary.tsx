import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';

export default function TripSummary() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Trip Summary</h2>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">Destination</p>
            <p className="text-sm text-gray-600">Not set</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-primary-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">Dates</p>
            <p className="text-sm text-gray-600">Not set</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-primary-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">Travelers</p>
            <p className="text-sm text-gray-600">Not set</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <DollarSign className="h-5 w-5 text-primary-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">Budget</p>
            <p className="text-sm text-gray-600">Not set</p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Your trip details will appear here as you chat with the AI assistant
        </p>
      </div>
    </div>
  );
}
