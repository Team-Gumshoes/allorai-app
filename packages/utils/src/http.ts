/**
 * HTTP client utilities
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { TIMEOUTS, HTTP_STATUS } from './constants';

/**
 * HTTP client configuration options
 */
export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Creates a configured HTTP client with error handling
 *
 * @param config - Client configuration
 * @returns Configured axios instance
 *
 * @example
 * const client = createHttpClient({
 *   baseURL: 'http://localhost:3001',
 *   timeout: 30000,
 * });
 *
 * const response = await client.get('/flights/search');
 */
export function createHttpClient(config: HttpClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout || TIMEOUTS.API_REQUEST,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (requestConfig) => {
      // Add auth token if available
      const token = localStorage.getItem('allorai_auth_token');
      if (token && requestConfig.headers) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
      return requestConfig;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      // Handle common errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        switch (status) {
          case HTTP_STATUS.UNAUTHORIZED:
            // Handle unauthorized (e.g., redirect to login)
            console.error('Unauthorized request');
            break;
          case HTTP_STATUS.NOT_FOUND:
            console.error('Resource not found');
            break;
          case HTTP_STATUS.INTERNAL_SERVER_ERROR:
            console.error('Server error');
            break;
          default:
            console.error(`HTTP error: ${status}`);
        }
      } else if (error.request) {
        // Request made but no response received
        console.error('Network error: No response received');
      } else {
        // Error setting up request
        console.error('Request setup error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Handles API errors and returns user-friendly messages
 *
 * @param error - Axios error object
 * @returns User-friendly error message
 *
 * @example
 * try {
 *   await client.get('/data');
 * } catch (error) {
 *   const message = handleApiError(error);
 *   alert(message);
 * }
 */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      if (data?.message) {
        return data.message;
      }

      switch (status) {
        case HTTP_STATUS.BAD_REQUEST:
          return 'Invalid request. Please check your input.';
        case HTTP_STATUS.UNAUTHORIZED:
          return 'You are not authorized. Please log in.';
        case HTTP_STATUS.FORBIDDEN:
          return 'Access denied.';
        case HTTP_STATUS.NOT_FOUND:
          return 'Resource not found.';
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          return 'Server error. Please try again later.';
        case HTTP_STATUS.SERVICE_UNAVAILABLE:
          return 'Service temporarily unavailable.';
        default:
          return `Error: ${status}`;
      }
    } else if (error.request) {
      return 'Network error. Please check your connection.';
    }
  }

  return 'An unexpected error occurred.';
}

/**
 * Checks if error is a network error (no response from server)
 *
 * @param error - Error object
 * @returns True if network error
 */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

/**
 * Checks if error is a timeout error
 *
 * @param error - Error object
 * @returns True if timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.code === 'ECONNABORTED';
}

/**
 * Retries a failed request with exponential backoff
 *
 * @param fn - Function that returns a promise
 * @param maxRetries - Maximum number of retries
 * @param delay - Initial delay in milliseconds
 * @returns Promise that resolves with function result
 *
 * @example
 * const data = await retryRequest(
 *   () => client.get('/data'),
 *   3,
 *   1000
 * );
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
}
