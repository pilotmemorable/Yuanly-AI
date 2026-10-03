import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handler middleware
 * Catches all unhandled errors and returns standardized error responses
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error_code: 'ERR_DUPLICATE',
      message: 'A record with this value already exists'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error_code: 'ERR_NOT_FOUND',
      message: 'Record not found'
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      error_code: 'ERR_FOREIGN_KEY',
      message: 'Referenced record does not exist'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error_code: 'ERR_VALIDATION',
      message: err.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error_code: 'ERR_INVALID_TOKEN',
      message: 'Invalid authentication token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error_code: 'ERR_TOKEN_EXPIRED',
      message: 'Authentication token has expired'
    });
  }

  // Default
  res.status(err.status || 500).json({
    error_code: err.errorCode || 'ERR_INTERNAL',
    message: err.message || 'Internal server error'
  });
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error_code: 'ERR_NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`
  });
};