import { Controller, Post, Get, Delete, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { IsString, MinLength } from 'class-validator';

class RenameEnvironmentDto { @IsString() @MinLength(1) name: string; }

@Controller('projects/:projectId/environments')
@UseGuards(JwtAuthGuard)
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Post()
  create(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Body() dto: CreateEnvironmentDto,
  ) {
    return this.environmentsService.create(req.user.id, projectId, dto);
  }

  @Get()
  list(@Request() req: any, @Param('projectId') projectId: string) {
    return this.environmentsService.list(req.user.id, projectId);
  }

  @Delete(':envId')
  remove(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
  ) {
    return this.environmentsService.remove(req.user.id, projectId, envId);
  }

  @Patch(':envId')
  rename(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
    @Body() dto: RenameEnvironmentDto,
  ) {
    return this.environmentsService.rename(req.user.id, projectId, envId, dto.name);
  }
}

@Controller('environments')
@UseGuards(JwtAuthGuard)
export class AllEnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Get()
  listAll(@Request() req: any) {
    return this.environmentsService.listAll(req.user.id);
  }
}
