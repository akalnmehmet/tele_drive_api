import { Request, Response, NextFunction } from 'express';
import { SensorService } from './sensor.service';

export const SensorController = {
  async ingest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reading = await SensorService.ingest(req.vehicle!.id, req.body);
      res.status(201).json({ status: 'success', data: reading });
    } catch (err) { next(err); }
  },

  async findByVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const readings = await SensorService.findByVehicle(req.params['id'] as string);
      res.json({ status: 'success', data: readings });
    } catch (err) { next(err); }
  },

  async findFaults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const faults = await SensorService.findFaults(req.params['id'] as string);
      res.json({ status: 'success', data: faults });
    } catch (err) { next(err); }
  },

  async findByRange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SensorService.findByRange(req.params['id'] as string, req.query as any);
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  },
};
