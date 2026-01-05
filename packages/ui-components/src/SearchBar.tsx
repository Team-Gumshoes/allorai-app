import React from 'react';

/**
 * SearchBar component props
 */
export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Current value of the search input
   */
  value: string;
  /**
   * Callback when value changes
   */
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Show search icon
   */
  showIcon?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * SearchBar component for user input
 *
 * @example
 * ```tsx
 * <SearchBar
 *   value={query}
 *   onChange={(e) => setQuery(e.target.value)}
 *   placeholder="Search for flights..."
 * />
 * ```
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  showIcon = true,
  className = '',
  ...props
}: SearchBarProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      {showIcon && (
        <svg
          className="absolute left-3 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      )}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-gray-300 ${
          showIcon ? 'pl-10' : 'pl-4'
        } pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200`}
        {...props}
      />
    </div>
  );
}
