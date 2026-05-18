import { IsString, IsUUID } from 'class-validator';

export class CompleteRecoveryDto {
  @IsUUID()
  deviceId: string;

  @IsUUID()
  environmentId: string;

  @IsString()
  wrappedDEK: string;
}
