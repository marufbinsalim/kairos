import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

export enum CliAuthStatus {
  pending = 'pending',
  approved = 'approved',
  denied = 'denied',
}

/** Short-lived device-code session: `kairos login` creates one, the web dashboard approves it. */
@Entity('cli_auth_requests')
export class CliAuthRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Short human-readable code shown in the terminal and typed/confirmed in the browser. */
  @Index({ unique: true })
  @Column()
  code: string;

  /** Long random secret the CLI polls with — never shown in the browser. */
  @Index({ unique: true })
  @Column()
  pollSecret: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'enum', enum: CliAuthStatus, default: CliAuthStatus.pending })
  status: CliAuthStatus;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
