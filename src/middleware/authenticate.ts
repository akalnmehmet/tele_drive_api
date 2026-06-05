import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../common/errors/AppError';

export interface JwtPayload {
  userId: string;
  role: string;
  stage: 'pre-auth' | 'full';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Yetkilendirme tokeni gerekli', 401));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (payload.stage !== 'full') {
      return next(new AppError('2FA doğrulaması tamamlanmamış', 401));
    }

    req.user = payload;
    next();
  } catch {
    next(new AppError('Geçersiz veya süresi dolmuş token', 401));
  }
}
