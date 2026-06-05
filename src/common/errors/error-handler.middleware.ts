import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Beklenmeyen hatalar
  logger.error('Beklenmeyen hata:', { message: err.message, stack: err.stack });

  res.status(500).json({
    status: 'error',
    message: env.NODE_ENV === 'production' ? 'Sunucu hatası' : err.message,
  });
}
