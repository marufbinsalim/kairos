import { IsEnum, IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { DeviceType } from '@kairos/db';

export class RegisterDeviceDto {
  @IsString()
  publicKey: string;

  @IsEnum(DeviceType)
  type: DeviceType;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  environmentIds?: string[];
}
