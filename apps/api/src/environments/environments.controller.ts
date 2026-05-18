import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEnvironmentDto } from './dto/create-environment.dto';

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
