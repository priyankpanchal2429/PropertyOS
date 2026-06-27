import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error Handler]`, err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Validation Error',
      errors: Object.values((err as any).errors).map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // Handle Mongoose duplicate key errors
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
    });
  }

  // Fallback for unhandled/internal server errors
  const isProd = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: isProd ? 'Internal Server Error' : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
};
