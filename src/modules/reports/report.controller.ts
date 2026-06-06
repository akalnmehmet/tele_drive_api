import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';

export const ReportController = {
  // POST /reports
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await ReportService.create(req.body, req.user!.userId);
      res.status(202).json({
        status: 'success',
        message: 'Rapor kuyruğa alındı. Durum için GET /api/reports/:id kullanın.',
        data: { id: job.id, status: job.status, type: job.type },
      });
    } catch (err) { next(err); }
  },

  // GET /reports
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit  = req.query['limit']  ? parseInt(req.query['limit']  as string, 10) : 20;
      const offset = req.query['offset'] ? parseInt(req.query['offset'] as string, 10) : 0;
      const result = await ReportService.findByUser(req.user!.userId, limit, offset);
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  },

  // GET /reports/:id
  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await ReportService.findById(req.params['id'] as string, req.user!.userId);
      res.json({ status: 'success', data: job });
    } catch (err) { next(err); }
  },

  // GET /reports/:id/download
  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filePath = await ReportService.getFilePath(req.params['id'] as string, req.user!.userId);
      const ext      = path.extname(filePath).toLowerCase();
      const mimeType = ext === '.pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
      res.download(filePath);
    } catch (err) { next(err); }
  },
};
