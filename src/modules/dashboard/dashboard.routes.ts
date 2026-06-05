import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { DashboardController } from './dashboard.controller';

const router = Router();

// JWT zorunlu — her iki rol de (fleet_manager + engineer) erişebilir
router.use(authenticate);

router.get('/', DashboardController.getSnapshot);

export default router;
