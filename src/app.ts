import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { defaultLimiter } from './middleware/rate-limit';
import { errorHandler } from './common/errors/error-handler.middleware';
import authRoutes       from './modules/auth/auth.routes';
import vehicleRoutes    from './modules/vehicles/vehicle.routes';
import telemetryRoutes  from './modules/telemetry/telemetry.routes';
import sensorRoutes     from './modules/sensors/sensor.routes';
import reportRoutes     from './modules/reports/report.routes';

const app = express();

// Güvenlik middleware'leri
app.use(helmet());
app.use(cors());
app.use(defaultLimiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Landing page
app.get('/', (_req, res) => {
  res.json({
    name:        'TeleDrive API',
    description: 'Otonom Araç Telemetri ve Filo Yönetim REST API',
    version:     '1.0.0',
    status:      '🟢 online',
    timestamp:   new Date().toISOString(),
    endpoints: {
      auth:      '/api/auth',
      vehicles:  '/api/vehicles',
      telemetry: '/api/telemetry',
      sensors:   '/api/sensors',
      reports:   '/api/reports',
    },
    docs: 'https://github.com/realsenseai/tele-drive-api',
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Modül route'ları
app.use('/api/auth',      authRoutes);
app.use('/api/vehicles',  vehicleRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/sensors',   sensorRoutes);
app.use('/api/reports',   reportRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Endpoint bulunamadı' });
});

// Global error handler (en sona olmalı)
app.use(errorHandler);

export default app;
