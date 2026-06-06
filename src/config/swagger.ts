import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'TeleDrive API',
      description: 'Otonom Araç Telemetri ve Filo Yönetim REST API',
      version: '1.0.0',
    },
    servers: [{ url: '/api', description: 'API' }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Login sonrası alınan JWT token',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Api-Key',
          description: 'Araç API anahtarı (td_ prefix)',
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────────────────────
        RegisterDto: {
          type: 'object', required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'manager@teledrive.io' },
            password: { type: 'string', minLength: 8, example: 'Admin1234!' },
            role:     { type: 'string', enum: ['fleet_manager', 'engineer'], default: 'engineer' },
          },
        },
        LoginDto: {
          type: 'object', required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        TotpDto: {
          type: 'object', required: ['token'],
          properties: { token: { type: 'string', minLength: 6, maxLength: 6, example: '123456' } },
        },
        // ── Vehicle ───────────────────────────────────────────────────────────
        CreateVehicleDto: {
          type: 'object', required: ['plate', 'model'],
          properties: {
            plate:               { type: 'string', example: '34TDR01' },
            model:               { type: 'string', example: 'Tesla Model 3' },
            assignedEngineerId:  { type: 'string', format: 'uuid', nullable: true },
          },
        },
        UpdateVehicleDto: {
          type: 'object',
          properties: {
            plate:               { type: 'string' },
            model:               { type: 'string' },
            status:              { type: 'string', enum: ['active', 'idle', 'fault', 'offline'] },
            assignedEngineerId:  { type: 'string', format: 'uuid', nullable: true },
            lowBatteryThreshold: { type: 'number', minimum: 0, maximum: 100, description: 'Batarya eşiği (%)' },
            maxSpeedThreshold:   { type: 'number', minimum: 0, nullable: true, description: 'Hız eşiği (km/h), null = devre dışı' },
          },
        },
        // ── Telemetry ─────────────────────────────────────────────────────────
        IngestTelemetryDto: {
          type: 'object', required: ['speed', 'latitude', 'longitude', 'batteryLevel'],
          properties: {
            speed:        { type: 'number', minimum: 0, maximum: 300, example: 72.5 },
            latitude:     { type: 'number', minimum: -90,  maximum: 90,  example: 41.015137 },
            longitude:    { type: 'number', minimum: -180, maximum: 180, example: 28.97953 },
            batteryLevel: { type: 'number', minimum: 0, maximum: 100, example: 84.3 },
            recordedAt:   { type: 'string', format: 'date-time' },
          },
        },
        // ── Sensor ───────────────────────────────────────────────────────────
        IngestSensorDto: {
          type: 'object', required: ['sensorType', 'status'],
          properties: {
            sensorType: { type: 'string', enum: ['lidar', 'camera', 'radar', 'gps', 'imu'] },
            status:     { type: 'string', enum: ['ok', 'degraded', 'fault'] },
            value:      { type: 'object', nullable: true, example: { error: 'lens_blocked' } },
            recordedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Report ────────────────────────────────────────────────────────────
        CreateReportDto: {
          type: 'object', required: ['type', 'dateFrom', 'dateTo'],
          properties: {
            type:      { type: 'string', enum: ['daily_pdf', 'fleet_excel'] },
            vehicleId: { type: 'string', format: 'uuid', description: 'daily_pdf için zorunlu' },
            dateFrom:  { type: 'string', format: 'date', example: '2026-06-01' },
            dateTo:    { type: 'string', format: 'date', example: '2026-06-05' },
          },
        },
        // ── Common ───────────────────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            status:  { type: 'string', example: 'error' },
            message: { type: 'string' },
            errors:  { type: 'object' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth',      description: 'Kimlik doğrulama ve 2FA' },
      { name: 'Vehicles',  description: 'Araç yönetimi' },
      { name: 'Telemetry', description: 'Telemetri alımı ve sorgulama' },
      { name: 'Sensors',   description: 'Sensör alımı ve arıza takibi' },
      { name: 'Reports',   description: 'Asenkron rapor yönetimi' },
      { name: 'Users',     description: 'Kullanıcı yönetimi (fleet_manager)' },
      { name: 'Dashboard', description: 'Filo özet istatistikleri' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
