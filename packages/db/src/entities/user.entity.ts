import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany,
} from 'typeorm';
import { Device } from './device.entity';
import { Project } from './project.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  googleId: string;

  @Column({ type: 'text', nullable: true })
  name: string | null;

  @Column({ type: 'text', nullable: true })
  picture: string | null;

  @Column({ type: 'text', nullable: true })
  mnemonicEncryptedPrivateKey: string | null;

  @Column({ type: 'text', nullable: true })
  publicKey: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Device, (device) => device.user)
  devices: Device[];

  @OneToMany(() => Project, (project) => project.user)
  projects: Project[];
}
