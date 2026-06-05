import { AppDataSource } from '../../config/database';
import { TelemetryReading } from './telemetry.entity';

export const TelemetryRepository = AppDataSource.getRepository(TelemetryReading).extend({
  findLatest(vehicleId: string) {
    return this.findOne({
      where: { vehicleId },
      order: { recordedAt: 'DESC' },
    });
  },

  findByRange(
    vehicleId: string,
    from: Date,
    to: Date,
    limit: number,
    offset: number,
  ) {
    return this.createQueryBuilder('t')
      .where('t.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('t.recorded_at BETWEEN :from AND :to', { from, to })
      .orderBy('t.recorded_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .getManyAndCount();
  },

  async getStats(vehicleId: string, from: Date, to: Date) {
    return this.createQueryBuilder('t')
      .select('AVG(t.speed)',         'avgSpeed')
      .addSelect('MAX(t.speed)',       'maxSpeed')
      .addSelect('MIN(t.battery_level)', 'minBattery')
      .addSelect('AVG(t.battery_level)', 'avgBattery')
      .addSelect('COUNT(*)',            'totalReadings')
      .where('t.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('t.recorded_at BETWEEN :from AND :to', { from, to })
      .getRawOne();
  },
});
