import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Environment } from './environment.entity';

@Entity('secrets')
export class Secret {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  environmentId: string;

  @ManyToOne(() => Environment, (env) => env.secrets)
  @JoinColumn({ name: 'environmentId' })
  environment: Environment;

  @Column()
  key: string;

  @Column({ type: 'text' })
  encryptedValue: string;

  @Column({ type: 'text' })
  iv: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
