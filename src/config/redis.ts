import IORedis from 'ioredis';
import { env } from './env';

export const redisConnection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null, // BullMQ gereksinimi
});

redisConnection.on('connect', () => {
  console.log('✅ Redis bağlantısı kuruldu');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis bağlantı hatası:', err.message);
});
