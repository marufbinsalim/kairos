import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { WrappedDEK } from './wrapped-dek.entity';

export enum DeviceType {
  web = 'web',
  cli = 'cli',
  recovery_device = 'recovery_device',
}

export enum DeviceStatus {
  pending = 'pending',
  active = 'active',
  revoked = 'revoked',
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: DeviceType })
  type: DeviceType;

  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.pending })
  status: DeviceStatus;

  @Column({ type: 'text' })
  publicKey: string;

  @Column({ nullable: true, type: 'varchar' })
  label: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  requestedEnvironmentIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => WrappedDEK, (wdek) => wdek.device)
  wrappedDEKs: WrappedDEK[];
}
