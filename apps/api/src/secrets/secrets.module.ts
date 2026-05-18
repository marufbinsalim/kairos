import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Secret, Environment, Project } from '@kairos/db';
import { SecretsService } from './secrets.service';
import { SecretsController } from './secrets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Secret, Environment, Project])],
  providers: [SecretsService],
  controllers: [SecretsController],
})
export class SecretsModule {}
