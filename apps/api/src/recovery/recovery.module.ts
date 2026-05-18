import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WrappedDEK, Environment, Project } from '@kairos/db';
import { RecoveryService } from './recovery.service';
import { RecoveryController } from './recovery.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WrappedDEK, Environment, Project])],
  providers: [RecoveryService],
  controllers: [RecoveryController],
})
export class RecoveryModule {}
