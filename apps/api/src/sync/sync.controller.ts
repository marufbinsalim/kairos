import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get(':environmentId')
  sync(
    @Request() req: any,
    @Param('environmentId') environmentId: string,
    @Query('deviceId') deviceId: string,
  ) {
    return this.syncService.sync(req.user.id, deviceId, environmentId);
  }
}
