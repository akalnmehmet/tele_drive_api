import { Request, Response, NextFunction } from 'express';
import { VehicleService } from './vehicle.service';

export const VehicleController = {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, model, limit, offset } = req.query as {
        status?: string; model?: string; limit?: string; offset?: string;
      };
      const result = await VehicleService.findAll({
        status,
        model,
        limit:  limit  ? parseInt(limit,  10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  },

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await VehicleService.findById(req.params['id'] as string);
      res.json({ status: 'success', data: vehicle });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await VehicleService.create(req.body);
      res.status(201).json({ status: 'success', data: vehicle });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await VehicleService.update(req.params['id'] as string, req.body);
      res.json({ status: 'success', data: vehicle });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await VehicleService.remove(req.params['id'] as string);
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  },

  async rotateApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await VehicleService.rotateApiKey(req.params['id'] as string);
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  },

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await VehicleService.getStatus(req.params['id'] as string);
      res.json({ status: 'success', data: status });
    } catch (err) { next(err); }
  },
};
