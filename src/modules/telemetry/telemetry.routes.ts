import { Router } from 'express';
import { TelemetryController } from './telemetry.controller';
import { apiKeyAuth } from '../../middleware/api-key-auth';
import { validate } from '../../middleware/validate';
import { telemetryLimiter } from '../../middleware/rate-limit';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';

const router = Router();

/**
 * @openapi
 * /telemetry:
 *   post:
 *     tags: [Telemetry]
 *     summary: Telemetri verisi gönder (araç cihazı)
 *     security: [{ ApiKeyAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/IngestTelemetryDto' }
 *     responses:
 *       201: { description: Kayıt oluşturuldu }
 *       401: { description: Geçersiz API anahtarı }
 */
router.post(
  '/',
  telemetryLimiter,
  apiKeyAuth,
  validate(IngestTelemetryDto),
  TelemetryController.ingest,
);

export default router;
