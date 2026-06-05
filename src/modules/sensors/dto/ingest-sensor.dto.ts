import { z } from 'zod';
import { SensorType, SensorStatus } from '../sensor-reading.entity';

export const IngestSensorDto = z.object({
  sensorType: z.enum(['lidar', 'camera', 'radar', 'gps', 'imu']),
  status:     z.enum(['ok', 'degraded', 'fault']),
  value:      z.record(z.string(), z.unknown()).optional(),
  recordedAt: z.string().datetime({ message: 'Geçerli bir ISO 8601 tarih girin' }).optional(),
});

export type IngestSensorDto = z.infer<typeof IngestSensorDto>;
