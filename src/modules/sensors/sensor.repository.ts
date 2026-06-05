import { AppDataSource } from '../../config/database';
import { SensorReading, SensorStatus } from './sensor-reading.entity';

export const SensorRepository = AppDataSource.getRepository(SensorReading).extend({
  findLatestByVehicle(vehicleId: string) {
    // Her sensör tipi için en son kaydı getirir
    return this.createQueryBuilder('s')
      .where('s.vehicle_id = :vehicleId', { vehicleId })
      .orderBy('s.recorded_at', 'DESC')
      .getMany();
  },

  findFaults(vehicleId: string) {
    return this.find({
      where: { vehicleId, status: SensorStatus.FAULT },
      order: { recordedAt: 'DESC' },
    });
  },

  findByRange(vehicleId: string, from: Date, to: Date, limit: number) {
    return this.createQueryBuilder('s')
      .where('s.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('s.recorded_at BETWEEN :from AND :to', { from, to })
      .orderBy('s.recorded_at', 'DESC')
      .limit(limit)
      .getManyAndCount();
  },
});
