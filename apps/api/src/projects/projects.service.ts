import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project, Environment, Secret, WrappedDEK } from '@kairos/db';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Environment)
    private readonly envRepo: Repository<Environment>,
    @InjectRepository(Secret)
    private readonly secretRepo: Repository<Secret>,
    @InjectRepository(WrappedDEK)
    private readonly wrappedDEKRepo: Repository<WrappedDEK>,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    const project = this.projectRepo.create({ userId, name: dto.name });
    return this.projectRepo.save(project);
  }

  async list(userId: string) {
    return this.projectRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(userId: string, projectId: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async remove(userId: string, projectId: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');
    const envs = await this.envRepo.find({ where: { projectId } });
    if (envs.length) {
      const envIds = envs.map((e) => e.id);
      await this.wrappedDEKRepo.delete({ environmentId: In(envIds) });
      await this.secretRepo.delete({ environmentId: In(envIds) });
      await this.envRepo.delete({ projectId });
    }
    await this.projectRepo.remove(project);
    return { success: true };
  }
}
