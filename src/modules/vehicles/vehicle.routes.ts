import { Router } from 'express';
import { VehicleController } from './vehicle.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { TelemetryController } from '../telemetry/telemetry.controller';
import { SensorController } from '../sensors/sensor.controller';
import { TelemetryRangeQueryDto, TelemetryStatsQueryDto } from '../telemetry/dto/telemetry-query.dto';
import { SensorRangeQueryDto } from '../sensors/dto/sensor-query.dto';

const router = Router();

// Tüm araç endpoint'leri JWT gerektirir
router.use(authenticate);

router.get('/',         VehicleController.findAll);
router.get('/:id',      VehicleController.findOne);
router.get('/:id/status', VehicleController.getStatus);

// Sadece fleet_manager yazabilir
router.post('/',
  authorize('fleet_manager'),
  validate(CreateVehicleDto),
  VehicleController.create,
);

router.patch('/:id',
  authorize('fleet_manager'),
  validate(UpdateVehicleDto),
  VehicleController.update,
);

router.delete('/:id',
  authorize('fleet_manager'),
  VehicleController.remove,
);

router.post('/:id/rotate-api-key',
  authorize('fleet_manager'),
  VehicleController.rotateApiKey,
);

// ── Telemetri alt route'ları (JWT ile sorgulama) ───────────────────────────
router.get('/:id/telemetry',
  validate(TelemetryRangeQueryDto, 'query'),
  TelemetryController.findByRange,
);
router.get('/:id/telemetry/latest', TelemetryController.findLatest);
router.get('/:id/telemetry/stats',
  validate(TelemetryStatsQueryDto, 'query'),
  TelemetryController.getStats,
);

// ── Sensör alt route'ları ──────────────────────────────────────────────────
router.get('/:id/sensors',         SensorController.findByVehicle);
router.get('/:id/sensors/faults',  SensorController.findFaults);
router.get('/:id/sensors/history',
  validate(SensorRangeQueryDto, 'query'),
  SensorController.findByRange,
);

export default router;
