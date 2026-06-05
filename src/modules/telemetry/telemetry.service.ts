import { AppError } from '../../common/errors/AppError';
import { TelemetryRepository } from './telemetry.repository';
import { VehicleRepository } from '../vehicles/vehicle.repository';
import { VehicleStatus } from '../vehicles/vehicle.entity';
import type { IngestTelemetryDto } from './dto/ingest-telemetry.dto';

const DEFAULT_LIMIT  = 100;
const MAX_LIMIT      = 1000;

export const TelemetryService = {
  // ── Araç → API Key ile veri gönderir ─────────────────────────────────────
  async ingest(vehicleId: string, dto: IngestTelemetryDto) {
    const reading = TelemetryRepository.create({
      vehicleId,
      speed:        dto.speed,
      latitude:     dto.latitude,
      longitude:    dto.longitude,
      batteryLevel: dto.batteryLevel,
      recordedAt:   dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
    });

    const saved = await TelemetryRepository.save(reading);

    // Araç durumunu güncelle (speed>0 → active, aksi idle)
    await VehicleRepository.update(vehicleId, {
      status: dto.speed > 0 ? VehicleStatus.ACTIVE : VehicleStatus.IDLE,
    });

    return saved;
  },

  // ── Yönetici → Geçmiş verileri sorgular ──────────────────────────────────
  async findByRange(
    vehicleId: string,
    query: { from?: string; to?: string; limit?: string; offset?: string },
  ) {
    const vehicle = await VehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Araç bulunamadı', 404);

    const now   = new Date();
    const from  = query.from  ? new Date(query.from)  : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const to    = query.to    ? new Date(query.to)    : now;
    const limit  = Math.min(parseInt(query.limit  ?? String(DEFAULT_LIMIT)), MAX_LIMIT);
    const offset = parseInt(query.offset ?? '0');

    if (from > to) throw new AppError('"from" tarihi "to" tarihinden büyük olamaz', 400);

    const [readings, total] = await TelemetryRepository.findByRange(vehicleId, from, to, limit, offset);

    return { readings, total, limit, offset, from, to };
  },

  // ── Son kayıt ─────────────────────────────────────────────────────────────
  async findLatest(vehicleId: string) {
    const vehicle = await VehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Araç bulunamadı', 404);

    const reading = await TelemetryRepository.findLatest(vehicleId);
    if (!reading) throw new AppError('Bu araç için henüz telemetri verisi yok', 404);
    return reading;
  },

  // ── İstatistikler ─────────────────────────────────────────────────────────
  async getStats(
    vehicleId: string,
    query: { from?: string; to?: string },
  ) {
    const vehicle = await VehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Araç bulunamadı', 404);

    const now  = new Date();
    const from = query.from ? new Date(query.from) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const to   = query.to   ? new Date(query.to)   : now;

    const stats = await TelemetryRepository.getStats(vehicleId, from, to);
    return { vehicleId, from, to, stats };
  },
};
