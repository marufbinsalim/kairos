import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Device } from './entities/device.entity';
import { Project } from './entities/project.entity';
import { Environment } from './entities/environment.entity';
import { WrappedDEK } from './entities/wrapped-dek.entity';
import { Secret } from './entities/secret.entity';
import { CliAuthRequest } from './entities/cli-auth-request.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Device, Project, Environment, WrappedDEK, Secret, CliAuthRequest],
  migrations: [],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
});
