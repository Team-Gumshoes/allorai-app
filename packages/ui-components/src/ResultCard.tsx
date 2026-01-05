import React from 'react';

/**
 * ResultCard component props
 */
export interface ResultCardProps {
  /**
   * Main title of the result
   */
  title: string;
  /**
   * Subtitle or secondary text
   */
  subtitle?: string;
  /**
   * Price information
   */
  price?: string;
  /**
   * Rating (0-5)
   */
  rating?: number;
  /**
   * Image URL
   */
  image?: string;
  /**
   * Badges/tags to display
   */
  badges?: string[];
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Additional details to show
   */
  details?: Array<{ label: string; value: string }>;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ResultCard component for displaying search results (flights, hotels, etc.)
 *
 * @example
 * ```tsx
 * <ResultCard
 *   title="Hilton Paris"
 *   subtitle="Luxury Hotel in Central Paris"
 *   price="$250/night"
 *   rating={4.5}
 *   badges={['Free WiFi', 'Breakfast Included']}
 *   onClick={handleSelect}
 * />
 * ```
 */
export function ResultCard({
  title,
  subtitle,
  price,
  rating,
  image,
  badges = [],
  onClick,
  details = [],
  className = '',
}: ResultCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden ${className}`}
      onClick={onClick}
    >
      {image && (
        <div className="h-48 w-full overflow-hidden">
          <img src={image} alt={title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {price && (
            <div className="text-right ml-4">
              <p className="text-xl font-bold text-blue-600">{price}</p>
            </div>
          )}
        </div>

        {rating !== undefined && (
          <div className="flex items-center mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
            </div>
          </div>
        )}

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {badges.map((badge, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {details.length > 0 && (
          <div className="mt-3 space-y-1">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{detail.label}:</span>
                <span className="font-medium text-gray-900">{detail.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
