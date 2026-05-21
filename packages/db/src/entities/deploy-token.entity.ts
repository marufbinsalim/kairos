import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Environment } from './environment.entity';
import { User } from './user.entity';

@Entity('deploy_tokens')
@Index('UQ_DEPLOY_TOKEN_PER_ENV', ['environmentId'], { unique: true })
export class DeployToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  environmentId: string;

  @ManyToOne(() => Environment)
  @JoinColumn({ name: 'environmentId' })
  environment: Environment;

  @Column({ unique: true })
  tokenHash: string;

  @Column({ type: 'text' })
  tokenWrappedDEK: string;

  @CreateDateColumn()
  createdAt: Date;
}
