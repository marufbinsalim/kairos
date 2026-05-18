import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { RecoveryService } from './recovery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InitiateRecoveryDto } from './dto/initiate-recovery.dto';

@Controller('recovery')
@UseGuards(JwtAuthGuard)
export class RecoveryController {
  constructor(private readonly recoveryService: RecoveryService) {}

  @Post('initiate')
  initiate(@Request() req: any, @Body() dto: InitiateRecoveryDto) {
    return this.recoveryService.initiate(req.user.id, dto);
  }
}
