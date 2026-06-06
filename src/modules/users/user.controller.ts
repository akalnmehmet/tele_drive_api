import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';

export const UserController = {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit  = req.query['limit']  ? parseInt(req.query['limit']  as string, 10) : 20;
      const offset = req.query['offset'] ? parseInt(req.query['offset'] as string, 10) : 0;
      const result = await UserService.findAll(limit, offset);
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  },

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.findById(req.params['id'] as string);
      res.json({ status: 'success', data: user });
    } catch (err) { next(err); }
  },

  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.updateRole(
        req.params['id'] as string,
        req.body,
        req.user!.userId,
      );
      res.json({ status: 'success', data: user });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await UserService.remove(
        req.params['id'] as string,
        req.user!.userId,
      );
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  },
};
