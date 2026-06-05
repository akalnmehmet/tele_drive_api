import { Router } from 'express';
import { SensorController } from './sensor.controller';
import { apiKeyAuth } from '../../middleware/api-key-auth';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { telemetryLimiter } from '../../middleware/rate-limit';
import { IngestSensorDto } from './dto/ingest-sensor.dto';

const router = Router();

// Araç → sensör verisi gönderir (API Key)
router.post(
  '/',
  telemetryLimiter,
  apiKeyAuth,
  validate(IngestSensorDto),
  SensorController.ingest,
);

export default router;
