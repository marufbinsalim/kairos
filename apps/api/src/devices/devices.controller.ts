import {
  Controller, Post, Get, Delete, Patch, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { CompleteApprovalDto } from './dto/complete-approval.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  register(@Request() req: any, @Body() dto: RegisterDeviceDto) {
    return this.devicesService.registerDevice(req.user.id, dto);
  }

  @Post('complete-registration')
  completeRegistration(@Request() req: any, @Body() dto: CompleteRegistrationDto) {
    return this.devicesService.completeRegistration(req.user.id, dto);
  }

  @Get('pending')
  getPending(@Request() req: any) {
    return this.devicesService.getPendingDevices(req.user.id);
  }

  @Post('complete-approval')
  completeApproval(@Request() req: any, @Body() dto: CompleteApprovalDto) {
    return this.devicesService.completeApproval(req.user.id, dto);
  }

  @Get()
  listDevices(@Request() req: any) {
    return this.devicesService.listDevices(req.user.id);
  }

  @Patch(':id/label')
  updateLabel(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateLabelDto) {
    return this.devicesService.updateLabel(req.user.id, id, dto.label);
  }

  @Delete(':id')
  revokeDevice(@Request() req: any, @Param('id') id: string) {
    return this.devicesService.revokeDevice(req.user.id, id);
  }

  @Get(':id/environments')
  getDeviceEnvironments(@Request() req: any, @Param('id') id: string) {
    return this.devicesService.getDeviceEnvironments(req.user.id, id);
  }
}
