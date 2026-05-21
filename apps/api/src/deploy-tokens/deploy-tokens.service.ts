import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeployToken, Environment, Project, Secret } from '@kairos/db';
import { createHash } from 'crypto';
import { CreateDeployTokenDto } from './dto/create-deploy-token.dto';

@Injectable()
export class DeployTokensService {
  constructor(
    @InjectRepository(DeployToken)
    private readonly tokenRepo: Repository<DeployToken>,
    @InjectRepository(Environment)
    private readonly envRepo: Repository<Environment>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Secret)
    private readonly secretRepo: Repository<Secret>,
  ) {}

  async create(userId: string, dto: CreateDeployTokenDto) {
    const env = await this.envRepo.findOne({ where: { id: dto.environmentId } });
    if (!env) throw new NotFoundException('Environment not found');
    const project = await this.projectRepo.findOne({ where: { id: env.projectId, userId } });
    if (!project) throw new ForbiddenException('Access denied');

    const token = this.tokenRepo.create({
      userId,
      environmentId: dto.environmentId,
      tokenHash: dto.tokenHash,
      tokenWrappedDEK: dto.tokenWrappedDEK,
      label: dto.label ?? null,
    });
    await this.tokenRepo.save(token);
    return { id: token.id, label: token.label, createdAt: token.createdAt };
  }

  async list(userId: string, environmentId: string) {
    return this.tokenRepo.find({
      where: { userId, environmentId },
      select: ['id', 'label', 'createdAt', 'environmentId'],
      order: { createdAt: 'DESC' },
    });
  }

  async revoke(userId: string, tokenId: string) {
    const token = await this.tokenRepo.findOne({ where: { id: tokenId, userId } });
    if (!token) throw new NotFoundException('Deploy token not found');
    await this.tokenRepo.remove(token);
    return { success: true };
  }

  async rotate(userId: string, tokenId: string, dto: { tokenHash: string; tokenWrappedDEK: string }) {
    const token = await this.tokenRepo.findOne({ where: { id: tokenId, userId } });
    if (!token) throw new NotFoundException('Deploy token not found');
    token.tokenHash = dto.tokenHash;
    token.tokenWrappedDEK = dto.tokenWrappedDEK;
    await this.tokenRepo.save(token);
    return { id: token.id, label: token.label, createdAt: token.createdAt };
  }

  async exportWithToken(rawToken: string) {
    const tokenHash = createHash('sha256').update(Buffer.from(rawToken, 'base64')).digest('hex');
    const token = await this.tokenRepo.findOne({ where: { tokenHash } });
    if (!token) throw new NotFoundException('Invalid token');

    const secrets = await this.secretRepo.find({ where: { environmentId: token.environmentId } });
    return {
      tokenWrappedDEK: token.tokenWrappedDEK,
      secrets: secrets.map((s) => ({ key: s.key, encryptedValue: s.encryptedValue, iv: s.iv })),
    };
  }
}
