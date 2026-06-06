import { Router } from 'express';
import { SensorController } from './sensor.controller';
import { apiKeyAuth } from '../../middleware/api-key-auth';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { telemetryLimiter } from '../../middleware/rate-limit';
import { IngestSensorDto } from './dto/ingest-sensor.dto';

const router = Router();

/**
 * @openapi
 * /sensors:
 *   post:
 *     tags: [Sensors]
 *     summary: Sensör verisi gönder (araç cihazı)
 *     security: [{ ApiKeyAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/IngestSensorDto' }
 *     responses:
 *       201: { description: Kayıt oluşturuldu }
 *       401: { description: Geçersiz API anahtarı }
 */
router.post(
  '/',
  telemetryLimiter,
  apiKeyAuth,
  validate(IngestSensorDto),
  SensorController.ingest,
);

export default router;
