import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';

export const DashboardController = {
  async getSnapshot(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await DashboardService.getSnapshot();
      res.json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },
};
