import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Vehicle } from '../vehicles/vehicle.entity';

export enum ReportType {
  DAILY_PDF = 'daily_pdf',
  FLEET_EXCEL = 'fleet_excel',
}

export enum ReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DONE = 'done',
  FAILED = 'failed',
}

@Entity('report_jobs')
@Index(['requestedById'])
@Index(['status', 'createdAt'])
export class ReportJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId!: string | null;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle | null;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requested_by' })
  requestedBy!: User;

  @Column({ type: 'enum', enum: ReportType })
  type!: ReportType;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status!: ReportStatus;

  @Column({ name: 'file_path', nullable: true, type: 'varchar' })
  filePath!: string | null;

  @Column({ name: 'date_from', type: 'date' })
  dateFrom!: Date;

  @Column({ name: 'date_to', type: 'date' })
  dateTo!: Date;

  @Column({ name: 'error_message', nullable: true, type: 'varchar' })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
