import { Request, Response, NextFunction } from 'express';
import { VehicleRepository } from '../modules/vehicles/vehicle.repository';
import { AppError } from '../common/errors/AppError';
import { Vehicle } from '../modules/vehicles/vehicle.entity';

// Request'e araç bilgisini ekle
declare global {
  namespace Express {
    interface Request {
      vehicle?: Vehicle;
    }
  }
}

export async function apiKeyAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    return next(new AppError('X-Api-Key header gerekli', 401));
  }

  const vehicle = await VehicleRepository.findByApiKey(apiKey);
  if (!vehicle) {
    return next(new AppError('Geçersiz API anahtarı', 401));
  }

  req.vehicle = vehicle;
  next();
}
