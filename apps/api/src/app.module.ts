import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Device, Project, Environment, WrappedDEK, Secret } from '@kairos/db';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { ProjectsModule } from './projects/projects.module';
import { EnvironmentsModule } from './environments/environments.module';
import { SecretsModule } from './secrets/secrets.module';
import { SyncModule } from './sync/sync.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Device, Project, Environment, WrappedDEK, Secret],
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    DevicesModule,
    ProjectsModule,
    EnvironmentsModule,
    SecretsModule,
    SyncModule,
  ],
})
export class AppModule {}
