import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { DashboardController } from './dashboard.controller';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Filo özet istatistikleri
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Filo snapshot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalVehicles:      { type: integer }
 *                     activeVehicles:     { type: integer }
 *                     faultVehicles:      { type: integer }
 *                     offlineVehicles:    { type: integer }
 *                     lowBatteryVehicles: { type: array, items: { type: object } }
 *                     recentFaults:       { type: array, items: { type: object } }
 */
router.get('/', DashboardController.getSnapshot);

export default router;
