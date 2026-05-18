import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device, WrappedDEK, Secret, Environment, Project } from '@kairos/db';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Device, WrappedDEK, Secret, Environment, Project])],
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
