import { Worker } from 'bullmq';
import { env } from '../../config/env';
import { processFaultAlert, processReportReady } from '../processors/send-fault-alert';
import { logger } from '../../common/utils/logger';
import type { FaultAlertJobData, ReportReadyJobData } from '../queues';

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT };

export function startNotificationWorker(): Worker {
  const worker = new Worker(
    'notifications',
    async (job) => {
      logger.info('Bildirim isleniyor', { jobId: job.id, name: job.name });

      if (job.name === 'fault-alert') {
        await processFaultAlert(job.data as FaultAlertJobData);
      } else if (job.name === 'report-ready') {
        await processReportReady(job.data as ReportReadyJobData);
      } else {
        logger.warn('Bilinmeyen bildirim tipi', { name: job.name });
      }
    },
    { connection, concurrency: 5 },
  );

  worker.on('completed', (job) => {
    logger.info('Bildirim gonderildi', { jobId: job.id, name: job.name });
  });

  worker.on('failed', (job, err) => {
    logger.error('Bildirim basarisiz', { jobId: job?.id, error: err.message });
  });

  logger.info('Notification worker baslatildi');
  return worker;
}
