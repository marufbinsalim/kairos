import { Controller, Post, Get, Delete, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { IsString, MinLength } from 'class-validator';

class RenameProjectDto { @IsString() @MinLength(1) name: string; }

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, dto);
  }

  @Get()
  list(@Request() req: any) {
    return this.projectsService.list(req.user.id);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.remove(req.user.id, id);
  }

  @Patch(':id')
  rename(@Request() req: any, @Param('id') id: string, @Body() dto: RenameProjectDto) {
    return this.projectsService.rename(req.user.id, id, dto.name);
  }
}
