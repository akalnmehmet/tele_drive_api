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

@Entity('telemetry_readings')
@Index(['vehicleId', 'recordedAt'])
export class TelemetryReading {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId!: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.telemetryReadings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({ type: 'float' })
  speed!: number;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  latitude!: number;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  longitude!: number;

  @Column({ name: 'battery_level', type: 'float' })
  batteryLevel!: number;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
