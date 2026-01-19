import { Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';

export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error]', err);

  // Handle Axios errors (from service calls)
  if (axios.isAxiosError(err)) {
    const status = err.response?.status || 500;
    const message = err.response?.data || err.message;

    res.status(status).json({
      error: 'Service Error',
      message: typeof message === 'string' ? message : 'An error occurred while communicating with the service',
      details: err.response?.data,
    });
    return;
  }

  // Handle custom API errors
  const apiError = err as ApiError;
  const statusCode = apiError.statusCode || 500;
  const message = apiError.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: apiError.name || 'Error',
    message,
    details: apiError.details,
  });
};
