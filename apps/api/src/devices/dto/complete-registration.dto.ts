import { IsString, IsUUID } from 'class-validator';

export class CompleteRegistrationDto {
  @IsUUID()
  deviceId: string;

  @IsUUID()
  environmentId: string;

  @IsString()
  wrappedDEK: string;

  @IsString()
  wrappedDEKRecovery: string;
}
