import { Link, useLocation } from 'react-router-dom';
import { Plane, Hotel, Bus, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { name: 'Trip Planner', href: '/trip-planner', icon: MessageSquare },
  { name: 'Flights', href: '/flights', icon: Plane },
  { name: 'Hotels', href: '/hotels', icon: Hotel },
  { name: 'Transport', href: '/transport', icon: Bus },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-xs">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Plane className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">AllorAI</span>
            </Link>
          </div>

          <div className="flex space-x-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
