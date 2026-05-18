import { IsUUID } from 'class-validator';

export class InitiateRecoveryDto {
  @IsUUID()
  environmentId: string;
}
