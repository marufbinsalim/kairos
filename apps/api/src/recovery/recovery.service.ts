import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WrappedDEK, Environment, Project } from '@kairos/db';
import { InitiateRecoveryDto } from './dto/initiate-recovery.dto';

@Injectable()
export class RecoveryService {
  constructor(
    @InjectRepository(WrappedDEK)
    private readonly wrappedDEKRepo: Repository<WrappedDEK>,
    @InjectRepository(Environment)
    private readonly envRepo: Repository<Environment>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async initiate(userId: string, dto: InitiateRecoveryDto) {
    const env = await this.envRepo.findOne({ where: { id: dto.environmentId } });
    if (!env) throw new NotFoundException('Environment not found');
    const project = await this.projectRepo.findOne({ where: { id: env.projectId, userId } });
    if (!project) throw new NotFoundException('Access denied');

    const recoveryDEK = await this.wrappedDEKRepo.findOne({
      where: { environmentId: dto.environmentId, isRecovery: true },
    });
    if (!recoveryDEK) throw new NotFoundException('No recovery DEK found');

    return { wrappedDEKRecovery: recoveryDEK.wrappedDEK };
  }
}
