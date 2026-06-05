import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors/AppError';

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Kimlik doğrulaması gerekli', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bu işlem için yetkiniz yok', 403));
    }

    next();
  };
}
