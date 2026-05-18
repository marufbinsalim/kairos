import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { Secret } from './secret.entity';
import { WrappedDEK } from './wrapped-dek.entity';

@Entity('environments')
export class Environment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, (project) => project.environments)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Secret, (secret) => secret.environment)
  secrets: Secret[];

  @OneToMany(() => WrappedDEK, (wdek) => wdek.environment)
  wrappedDEKs: WrappedDEK[];
}
