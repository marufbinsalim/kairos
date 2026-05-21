import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Environment } from './environment.entity';
import { User } from './user.entity';

@Entity('deploy_tokens')
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

  @Column({ nullable: true, type: 'varchar' })
  label: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
