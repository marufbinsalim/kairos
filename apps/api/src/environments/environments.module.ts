import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Environment, Project, Secret, WrappedDEK } from '@kairos/db';
import { EnvironmentsService } from './environments.service';
import { EnvironmentsController, AllEnvironmentsController } from './environments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Environment, Project, Secret, WrappedDEK])],
  providers: [EnvironmentsService],
  controllers: [EnvironmentsController, AllEnvironmentsController],
  exports: [EnvironmentsService],
})
export class EnvironmentsModule {}
