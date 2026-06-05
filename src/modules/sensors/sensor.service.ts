import { AppError } from '../../common/errors/AppError';
import { SensorRepository } from './sensor.repository';
import { VehicleRepository } from '../vehicles/vehicle.repository';
import { UserRepository } from '../users/user.repository';
import { VehicleStatus } from '../vehicles/vehicle.entity';
import { SensorStatus, SensorType } from './sensor-reading.entity';
import { logger } from '../../common/utils/logger';
import { notificationQueue } from '../../jobs/queues';
import type { IngestSensorDto } from './dto/ingest-sensor.dto';

export const SensorService = {
  // ── Araç → sensör verisi gönderir (API Key) ───────────────────────────────
  async ingest(vehicleId: string, dto: IngestSensorDto) {
    const reading = SensorRepository.create({
      vehicleId,
      sensorType: dto.sensorType as SensorType,
      status:     dto.status as SensorStatus,
      value:      dto.value ?? null,
      recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
    });

    const saved = await SensorRepository.save(reading);

    // Kritik arıza tespiti → araç FAULT + notification queue
    if (dto.status === SensorStatus.FAULT) {
      const vehicle = await VehicleRepository.findById(vehicleId);
      if (vehicle) {
        await VehicleRepository.update(vehicleId, { status: VehicleStatus.FAULT });

        // Atanmış mühendisi bul
        let engineerEmail: string | null = null;
        if (vehicle.assignedEngineerId) {
          const engineer = await UserRepository.findById(vehicle.assignedEngineerId);
          engineerEmail = engineer?.email ?? null;
        }

        await notificationQueue.add('fault-alert', {
          vehicleId,
          vehiclePlate:  vehicle.plate,
          sensorType:    dto.sensorType,
          readingId:     saved.id,
          engineerEmail,
        });

        logger.warn('Sensör arızası tespit edildi — bildirim kuyruğa eklendi', {
          vehicleId,
          sensorType: dto.sensorType,
          engineerEmail,
        });
      }
    }

    return saved;
  },

  // ── Araç sensör listesi ───────────────────────────────────────────────────
  async findByVehicle(vehicleId: string) {
    const vehicle = await VehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Araç bulunamadı', 404);
    return SensorRepository.findLatestByVehicle(vehicleId);
  },

  // ── Sadece arızalı sensörler ──────────────────────────────────────────────
  async findFaults(vehicleId: string) {
    const vehicle = await VehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Araç bulunamadı', 404);
    return SensorRepository.findFaults(vehicleId);
  },

  // ── Geçmiş veriler ────────────────────────────────────────────────────────
  async findByRange(vehicleId: string, query: { from?: string; to?: string; limit?: string }) {
    const vehicle = await VehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Araç bulunamadı', 404);

    const now   = new Date();
    const from  = query.from ? new Date(query.from) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const to    = now;
    const limit = Math.min(parseInt(query.limit ?? '200'), 1000);

    const [readings, total] = await SensorRepository.findByRange(vehicleId, from, to, limit);
    return { readings, total, from, to };
  },
};
