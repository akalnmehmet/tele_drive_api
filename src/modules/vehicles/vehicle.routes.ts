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
import { VehicleQueryDto } from './dto/vehicle-query.dto';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /vehicles:
 *   get:
 *     tags: [Vehicles]
 *     summary: Araçları listele
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, idle, fault, offline] }
 *       - in: query
 *         name: model
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Araç listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicles: { type: array, items: { type: object } }
 *                     total:  { type: integer }
 *                     limit:  { type: integer }
 *                     offset: { type: integer }
 */
router.get('/', validate(VehicleQueryDto, 'query'), VehicleController.findAll);

/**
 * @openapi
 * /vehicles:
 *   post:
 *     tags: [Vehicles]
 *     summary: Yeni araç oluştur (fleet_manager)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateVehicleDto' }
 *     responses:
 *       201: { description: Araç oluşturuldu — yanıtta apiKey bulunur (tek seferlik) }
 *       409: { description: Plaka zaten kayıtlı }
 */
router.post('/', authorize('fleet_manager'), validate(CreateVehicleDto), VehicleController.create);

/**
 * @openapi
 * /vehicles/{id}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Araç detayı
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Araç detayı }
 *       404: { description: Araç bulunamadı }
 *   patch:
 *     tags: [Vehicles]
 *     summary: Araç güncelle (fleet_manager)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateVehicleDto' }
 *     responses:
 *       200: { description: Güncellendi }
 *   delete:
 *     tags: [Vehicles]
 *     summary: Araç sil (fleet_manager)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Silindi }
 */
router.get('/:id',      VehicleController.findOne);
router.get('/:id/status', VehicleController.getStatus);
router.patch('/:id',  authorize('fleet_manager'), validate(UpdateVehicleDto), VehicleController.update);
router.delete('/:id', authorize('fleet_manager'), VehicleController.remove);

/**
 * @openapi
 * /vehicles/{id}/rotate-api-key:
 *   post:
 *     tags: [Vehicles]
 *     summary: API anahtarı yenile (fleet_manager)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Yeni API anahtarı }
 */
router.post('/:id/rotate-api-key', authorize('fleet_manager'), VehicleController.rotateApiKey);

/**
 * @openapi
 * /vehicles/{id}/telemetry:
 *   get:
 *     tags: [Telemetry]
 *     summary: Telemetri geçmişi (zaman aralığı)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100, maximum: 1000 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200: { description: Telemetri kayıtları + sayfalama }
 */
router.get('/:id/telemetry',       validate(TelemetryRangeQueryDto, 'query'), TelemetryController.findByRange);
router.get('/:id/telemetry/latest', TelemetryController.findLatest);

/**
 * @openapi
 * /vehicles/{id}/telemetry/stats:
 *   get:
 *     tags: [Telemetry]
 *     summary: Telemetri istatistikleri (ort. hız, batarya vb.)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: avgSpeed, maxSpeed, minBattery, avgBattery, totalReadings }
 */
router.get('/:id/telemetry/stats', validate(TelemetryStatsQueryDto, 'query'), TelemetryController.getStats);

/**
 * @openapi
 * /vehicles/{id}/sensors:
 *   get:
 *     tags: [Sensors]
 *     summary: Her sensör tipinin en son kaydı
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: '{ sensors: [...], total: N }' }
 */
router.get('/:id/sensors',        SensorController.findByVehicle);

/**
 * @openapi
 * /vehicles/{id}/sensors/faults:
 *   get:
 *     tags: [Sensors]
 *     summary: Sadece arızalı sensörler
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: '{ sensors: [...], total: N }' }
 */
router.get('/:id/sensors/faults', SensorController.findFaults);

/**
 * @openapi
 * /vehicles/{id}/sensors/history:
 *   get:
 *     tags: [Sensors]
 *     summary: Sensör geçmişi (zaman aralığı + tip filtresi)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: sensorType
 *         schema: { type: string, enum: [lidar, camera, radar, gps, imu] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 200, maximum: 1000 }
 *     responses:
 *       200: { description: '{ readings, total, limit, from, to, sensorType }' }
 */
router.get('/:id/sensors/history', validate(SensorRangeQueryDto, 'query'), SensorController.findByRange);

export default router;
