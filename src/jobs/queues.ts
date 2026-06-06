import { Queue } from 'bullmq';
import { env } from '../config/env';

// BullMQ kendi ioredis sürümünü bundleladığından instance değil, options geçiyoruz
const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT };

// ── Job veri tipleri ──────────────────────────────────────────────────────────

export interface ReportJobData {
  reportJobId: string;
}

export interface FaultAlertJobData {
  vehicleId:  string;
  vehiclePlate: string;
  sensorType: string;
  readingId:  string;
  engineerEmail: string | null;
}

export interface ReportReadyJobData {
  to:       string;
  subject:  string;
  filePath: string;
  fileName: string;
}

export interface ThresholdAlertJobData {
  vehicleId:    string;
  vehiclePlate: string;
  alertType:    'low_battery' | 'high_speed';
  value:        number;
  threshold:    number;
  engineerEmail: string | null;
}

// ── Queue singleton'ları ──────────────────────────────────────────────────────

export const reportQueue = new Queue<ReportJobData, void, string>('report-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail:     { count: 50 },
  },
});

export const notificationQueue = new Queue<FaultAlertJobData | ReportReadyJobData | ThresholdAlertJobData, void, string>('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 200 },
    removeOnFail:     { count: 100 },
  },
});
