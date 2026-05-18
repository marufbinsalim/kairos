import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Environment } from './environment.entity';
import { Device } from './device.entity';

@Entity('wrapped_deks')
export class WrappedDEK {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  environmentId: string;

  @ManyToOne(() => Environment, (env) => env.wrappedDEKs)
  @JoinColumn({ name: 'environmentId' })
  environment: Environment;

  @Column({ nullable: true, type: 'varchar' })
  deviceId: string | null;

  @ManyToOne(() => Device, (device) => device.wrappedDEKs, { nullable: true })
  @JoinColumn({ name: 'deviceId' })
  device: Device | null;

  @Column({ type: 'text' })
  wrappedDEK: string;

  @Column({ type: 'text', nullable: true })
  wrappedByPublicKey: string | null;

  @Column({ default: false })
  isRecovery: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
