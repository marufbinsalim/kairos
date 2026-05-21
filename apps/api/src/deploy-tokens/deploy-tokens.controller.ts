import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
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
  upsert(@Request() req: any, @Body() dto: CreateDeployTokenDto) {
    return this.service.upsert(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  get(@Request() req: any, @Query('environmentId') environmentId: string) {
    return this.service.get(req.user.id, environmentId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  revoke(@Request() req: any, @Param('id') id: string) {
    return this.service.revoke(req.user.id, id);
  }

  @Post('export')
  export(@Body() dto: ExportDto) {
    return this.service.exportWithToken(dto.token);
  }
}
