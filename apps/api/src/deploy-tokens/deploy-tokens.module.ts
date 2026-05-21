import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeployToken, Environment, Project, Secret } from '@kairos/db';
import { DeployTokensService } from './deploy-tokens.service';
import { DeployTokensController } from './deploy-tokens.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeployToken, Environment, Project, Secret])],
  providers: [DeployTokensService],
  controllers: [DeployTokensController],
})
export class DeployTokensModule {}
