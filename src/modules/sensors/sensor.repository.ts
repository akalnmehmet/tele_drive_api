import { AppDataSource } from '../../config/database';
import { SensorReading, SensorStatus } from './sensor-reading.entity';

export const SensorRepository = AppDataSource.getRepository(SensorReading).extend({
  // Her sensör tipinin (lidar, camera, radar, gps, imu) sadece en son kaydını döner.
  // DISTINCT ON PostgreSQL'e özgü olduğundan raw SQL kullanılır.
  async findLatestByVehicle(vehicleId: string): Promise<SensorReading[]> {
    const sql = `
      SELECT DISTINCT ON (sensor_type)
             id, vehicle_id, sensor_type, status, value, recorded_at, created_at
      FROM   sensor_readings
      WHERE  vehicle_id = $1
      ORDER  BY sensor_type, recorded_at DESC
    `;
    const rows: {
      id: string; vehicle_id: string; sensor_type: string;
      status: string; value: unknown; recorded_at: Date; created_at: Date;
    }[] = await this.query(sql, [vehicleId]);

    return rows.map((r) => {
      const reading = new SensorReading();
      reading.id          = r.id;
      reading.vehicleId   = r.vehicle_id;
      reading.sensorType  = r.sensor_type as SensorReading['sensorType'];
      reading.status      = r.status      as SensorReading['status'];
      reading.value       = r.value as SensorReading['value'];
      reading.recordedAt  = new Date(r.recorded_at);
      reading.createdAt   = new Date(r.created_at);
      return reading;
    });
  },

  findFaults(vehicleId: string) {
    return this.find({
      where: { vehicleId, status: SensorStatus.FAULT },
      order: { recordedAt: 'DESC' },
    });
  },

  findByRange(vehicleId: string, from: Date, to: Date, limit: number, sensorType?: string) {
    const qb = this.createQueryBuilder('s')
      .where('s.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('s.recorded_at BETWEEN :from AND :to', { from, to })
      .orderBy('s.recorded_at', 'DESC')
      .limit(limit);

    if (sensorType) qb.andWhere('s.sensor_type = :sensorType', { sensorType });

    return qb.getManyAndCount();
  },
});
