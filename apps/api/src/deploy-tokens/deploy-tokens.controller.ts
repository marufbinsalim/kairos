import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DeployTokensService } from './deploy-tokens.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDeployTokenDto } from './dto/create-deploy-token.dto';
import { IsString } from 'class-validator';

class ExportDto { @IsString() token: string; }

@Controller('deploy-tokens')
export class DeployTokensController {
  constructor(private readonly service: DeployTokensService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() dto: CreateDeployTokenDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Request() req: any, @Query('environmentId') environmentId: string) {
    return this.service.list(req.user.id, environmentId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  revoke(@Request() req: any, @Param('id') id: string) {
    return this.service.revoke(req.user.id, id);
  }

  @Patch(':id/rotate')
  @UseGuards(JwtAuthGuard)
  rotate(@Request() req: any, @Param('id') id: string, @Body() dto: { tokenHash: string; tokenWrappedDEK: string }) {
    return this.service.rotate(req.user.id, id, dto);
  }

  @Post('export')
  export(@Body() dto: ExportDto) {
    return this.service.exportWithToken(dto.token);
  }
}
