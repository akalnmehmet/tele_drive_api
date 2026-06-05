import 'reflect-metadata';
import './config/env';
import { AppDataSource } from './config/database';
import { redisConnection } from './config/redis';
import { logger } from './common/utils/logger';
import { env } from './config/env';
import { startReportWorker } from './jobs/workers/report.worker';
import { startNotificationWorker } from './jobs/workers/notification.worker';
import app from './app';
import fs from 'fs';

async function bootstrap() {
  if (!fs.existsSync(env.REPORTS_DIR)) {
    fs.mkdirSync(env.REPORTS_DIR, { recursive: true });
  }

  await AppDataSource.initialize();
  logger.info('✅ PostgreSQL bağlantısı kuruldu');

  await redisConnection.ping();

  // BullMQ worker'larını başlat
  const reportWorker       = startReportWorker();
  const notificationWorker = startNotificationWorker();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Sunucu http://localhost:${env.PORT} adresinde çalışıyor`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} alındı — sunucu kapatılıyor...`);
    await reportWorker.close();
    await notificationWorker.close();
    server.close(async () => {
      await AppDataSource.destroy();
      await redisConnection.quit();
      logger.info('Sunucu başarıyla kapatıldı');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Uygulama başlatılamadı:', { message: err.message });
  process.exit(1);
});
