import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Environment, Project } from '@kairos/db';
import { CreateEnvironmentDto } from './dto/create-environment.dto';

@Injectable()
export class EnvironmentsService {
  constructor(
    @InjectRepository(Environment)
    private readonly envRepo: Repository<Environment>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async create(userId: string, projectId: string, dto: CreateEnvironmentDto) {
    const project = await this.projectRepo.findOne({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');
    const env = this.envRepo.create({ projectId, name: dto.name });
    return this.envRepo.save(env);
  }

  async list(userId: string, projectId: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');
    return this.envRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findOne(envId: string) {
    const env = await this.envRepo.findOne({ where: { id: envId } });
    if (!env) throw new NotFoundException('Environment not found');
    return env;
  }

  async listAll(userId: string) {
    const projects = await this.projectRepo.find({ where: { userId } });
    if (!projects.length) return [];
    const projectIds = projects.map((p) => p.id);
    const envs = await this.envRepo
      .createQueryBuilder('env')
      .where('env.projectId IN (:...projectIds)', { projectIds })
      .orderBy('env.createdAt', 'DESC')
      .getMany();
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    return envs.map((e) => ({ ...e, projectName: projectMap.get(e.projectId) ?? '' }));
  }
}
