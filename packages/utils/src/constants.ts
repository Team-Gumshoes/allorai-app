/**
 * Shared constants across the application
 */

/**
 * API base URLs
 */
export const API_BASE_URL = process.env.VITE_API_GATEWAY_URL || 'http://localhost:3001';

/**
 * Currency symbols mapping
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'Fr',
  CNY: '¥',
  INR: '₹',
};

/**
 * Date format patterns
 */
export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  MEDIUM: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  ISO: 'yyyy-MM-dd',
  TIME_12: 'hh:mm a',
  TIME_24: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
};

/**
 * Flight class display names
 */
export const FLIGHT_CLASS_NAMES = {
  economy: 'Economy',
  premium_economy: 'Premium Economy',
  business: 'Business',
  first: 'First Class',
};

/**
 * Transport type display names
 */
export const TRANSPORT_TYPE_NAMES = {
  car_rental: 'Car Rental',
  train: 'Train',
  bus: 'Bus',
  taxi: 'Taxi',
  rideshare: 'Rideshare',
  metro: 'Metro',
  ferry: 'Ferry',
};

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
};

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * API timeout settings (in milliseconds)
 */
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  AGENT_PROCESSING: 60000, // 1 minute
  FILE_UPLOAD: 120000, // 2 minutes
};

/**
 * Validation limits
 */
export const LIMITS = {
  MAX_PASSENGERS: 9,
  MIN_PASSENGERS: 1,
  MAX_SEARCH_RESULTS: 100,
  MIN_HOTEL_RATING: 0,
  MAX_HOTEL_RATING: 5,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

/**
 * Regular expressions for validation
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  AIRPORT_CODE: /^[A-Z]{3}$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  PHONE: /^[\d\s\-\+\(\)]{10,}$/,
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'allorai_user_preferences',
  SEARCH_HISTORY: 'allorai_search_history',
  SAVED_TRIPS: 'allorai_saved_trips',
  AUTH_TOKEN: 'allorai_auth_token',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  TIMEOUT: 'Request timed out. Please try again.',
};
