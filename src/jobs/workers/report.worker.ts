import { Worker } from 'bullmq';
import { env } from '../../config/env';
import { processReportJob } from '../processors/generate-report';
import { logger } from '../../common/utils/logger';
import type { ReportJobData } from '../queues';

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT };

export function startReportWorker(): Worker<ReportJobData, void, string> {
  const worker = new Worker<ReportJobData, void, string>(
    'report-generation',
    async (job) => {
      logger.info('Rapor isleniyor', { jobId: job.id, reportJobId: job.data.reportJobId });
      await processReportJob(job.data.reportJobId);
    },
    { connection, concurrency: 2 },
  );

  worker.on('completed', (job) => {
    logger.info('Rapor tamamlandi', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Rapor basarisiz', { jobId: job?.id, error: err.message });
  });

  logger.info('Report worker baslatildi');
  return worker;
}
