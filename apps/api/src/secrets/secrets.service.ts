import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Secret, Environment, Project } from '@kairos/db';
import { UpsertSecretDto } from './dto/upsert-secret.dto';

@Injectable()
export class SecretsService {
  constructor(
    @InjectRepository(Secret)
    private readonly secretRepo: Repository<Secret>,
    @InjectRepository(Environment)
    private readonly envRepo: Repository<Environment>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  private async verifyEnvAccess(userId: string, envId: string) {
    const env = await this.envRepo.findOne({ where: { id: envId } });
    if (!env) throw new NotFoundException('Environment not found');
    const project = await this.projectRepo.findOne({ where: { id: env.projectId, userId } });
    if (!project) throw new ForbiddenException('Access denied');
    return env;
  }

  async list(userId: string, envId: string) {
    await this.verifyEnvAccess(userId, envId);
    return this.secretRepo.find({ where: { environmentId: envId } });
  }

  async upsert(userId: string, envId: string, dto: UpsertSecretDto) {
    await this.verifyEnvAccess(userId, envId);
    let secret = await this.secretRepo.findOne({
      where: { environmentId: envId, key: dto.key },
    });
    if (secret) {
      secret.encryptedValue = dto.encryptedValue;
      secret.iv = dto.iv;
    } else {
      secret = this.secretRepo.create({
        environmentId: envId,
        key: dto.key,
        encryptedValue: dto.encryptedValue,
        iv: dto.iv,
      });
    }
    return this.secretRepo.save(secret);
  }

  async delete(userId: string, envId: string, key: string) {
    await this.verifyEnvAccess(userId, envId);
    const secret = await this.secretRepo.findOne({ where: { environmentId: envId, key } });
    if (!secret) throw new NotFoundException('Secret not found');
    await this.secretRepo.remove(secret);
    return { success: true };
  }
}
