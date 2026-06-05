import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Vehicle } from '../vehicles/vehicle.entity';

export enum SensorType {
  LIDAR = 'lidar',
  CAMERA = 'camera',
  RADAR = 'radar',
  GPS = 'gps',
  IMU = 'imu',
}

export enum SensorStatus {
  OK = 'ok',
  DEGRADED = 'degraded',
  FAULT = 'fault',
}

@Entity('sensor_readings')
@Index(['vehicleId', 'recordedAt'])
export class SensorReading {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId!: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.sensorReadings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({ name: 'sensor_type', type: 'enum', enum: SensorType })
  sensorType!: SensorType;

  @Column({ type: 'enum', enum: SensorStatus, default: SensorStatus.OK })
  status!: SensorStatus;

  @Column({ type: 'jsonb', nullable: true })
  value!: Record<string, unknown> | null;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
