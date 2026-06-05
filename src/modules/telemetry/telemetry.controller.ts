import { Request, Response, NextFunction } from 'express';
import { TelemetryService } from './telemetry.service';

export const TelemetryController = {
  // POST /telemetry  (X-Api-Key auth)
  async ingest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reading = await TelemetryService.ingest(req.vehicle!.id, req.body);
      res.status(201).json({ status: 'success', data: reading });
    } catch (err) { next(err); }
  },

  // GET /vehicles/:id/telemetry
  async findByRange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TelemetryService.findByRange(req.params['id'] as string, req.query as any);
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  },

  async findLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reading = await TelemetryService.findLatest(req.params['id'] as string);
      res.json({ status: 'success', data: reading });
    } catch (err) { next(err); }
  },

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await TelemetryService.getStats(req.params['id'] as string, req.query as any);
      res.json({ status: 'success', data: stats });
    } catch (err) { next(err); }
  },
};
