import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SecretsService } from './secrets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpsertSecretDto } from './dto/upsert-secret.dto';

@Controller('environments/:envId/secrets')
@UseGuards(JwtAuthGuard)
export class SecretsController {
  constructor(private readonly secretsService: SecretsService) {}

  @Get()
  list(@Request() req: any, @Param('envId') envId: string) {
    return this.secretsService.list(req.user.id, envId);
  }

  @Post()
  upsert(@Request() req: any, @Param('envId') envId: string, @Body() dto: UpsertSecretDto) {
    return this.secretsService.upsert(req.user.id, envId, dto);
  }

  @Delete(':key')
  delete(@Request() req: any, @Param('envId') envId: string, @Param('key') key: string) {
    return this.secretsService.delete(req.user.id, envId, key);
  }
}
