import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { TelemetryReading } from '../telemetry/telemetry.entity';
import { SensorReading } from '../sensors/sensor-reading.entity';

export enum VehicleStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  FAULT = 'fault',
  OFFLINE = 'offline',
}

@Entity('vehicles')
@Index(['status'])
@Index(['assignedEngineerId'])
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  plate!: string;

  @Column()
  model!: string;

  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.IDLE })
  status!: VehicleStatus;

  @Column({ name: 'api_key', unique: true })
  apiKey!: string;

  @Column({ name: 'assigned_engineer_id', nullable: true, type: 'uuid' })
  assignedEngineerId!: string | null;

  // Batarya eşiği: bu değerin altına düşünce alert gönderilir (% cinsinden)
  @Column({ name: 'low_battery_threshold', type: 'float', default: 20 })
  lowBatteryThreshold!: number;

  // Hız eşiği: bu değerin üzerine çıkınca alert gönderilir (km/h), null = devre dışı
  @Column({ name: 'max_speed_threshold', type: 'float', nullable: true })
  maxSpeedThreshold!: number | null;

  @ManyToOne(() => User, (user) => user.vehicles, { nullable: true })
  @JoinColumn({ name: 'assigned_engineer_id' })
  assignedEngineer!: User | null;

  @OneToMany(() => TelemetryReading, (reading) => reading.vehicle)
  telemetryReadings!: TelemetryReading[];

  @OneToMany(() => SensorReading, (reading) => reading.vehicle)
  sensorReadings!: SensorReading[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
