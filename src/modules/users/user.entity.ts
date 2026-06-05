import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Vehicle } from '../vehicles/vehicle.entity';

export enum UserRole {
  FLEET_MANAGER = 'fleet_manager',
  ENGINEER = 'engineer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ENGINEER })
  role!: UserRole;

  @Column({ name: 'totp_secret', nullable: true, type: 'varchar' })
  totpSecret!: string | null;

  @Column({ name: 'totp_enabled', default: false })
  totpEnabled!: boolean;

  @Column({ name: 'refresh_token', nullable: true, type: 'varchar' })
  refreshToken!: string | null;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.assignedEngineer)
  vehicles!: Vehicle[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
