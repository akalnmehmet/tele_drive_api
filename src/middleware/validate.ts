import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type Source = 'body' | 'query';

export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(source === 'query' ? req.query : req.body);
    if (!result.success) {
      res.status(400).json({
        status: 'error',
        message: 'Doğrulama hatası',
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }
    if (source === 'query') {
      // Express v5'te req.query read-only getter — mevcut objeyi mutate et
      Object.assign(req.query, result.data);
    } else {
      req.body = result.data;
    }
    next();
  };
}
