import { Router } from 'express';
import { TelemetryController } from './telemetry.controller';
import { apiKeyAuth } from '../../middleware/api-key-auth';
import { validate } from '../../middleware/validate';
import { telemetryLimiter } from '../../middleware/rate-limit';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';

const router = Router();

// Araç → veri gönderir (API Key auth + sıkı rate limit)
router.post(
  '/',
  telemetryLimiter,
  apiKeyAuth,
  validate(IngestTelemetryDto),
  TelemetryController.ingest,
);

export default router;
