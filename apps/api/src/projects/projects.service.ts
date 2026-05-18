import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '@kairos/db';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
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
}
