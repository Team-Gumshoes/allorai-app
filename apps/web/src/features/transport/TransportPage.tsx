import { useState } from 'react';
import { Search, Bus } from 'lucide-react';

export default function TransportPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Bus className="h-8 w-8 text-primary-600" />
          Search Transport
        </h1>
        <p className="mt-2 text-gray-600">
          Find the best transportation options for your journey
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Transport search coming soon...</p>
      </div>
    </div>
  );
}
