import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../modules/users/user.entity';
import { Vehicle } from '../modules/vehicles/vehicle.entity';
import { TelemetryReading } from '../modules/telemetry/telemetry.entity';
import { SensorReading } from '../modules/sensors/sensor-reading.entity';
import { ReportJob } from '../modules/reports/report-job.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  synchronize: env.NODE_ENV === 'development',
  logging: env.NODE_ENV === 'development',
  entities: [User, Vehicle, TelemetryReading, SensorReading, ReportJob],
  migrations: ['dist/migrations/*.js'],
});
