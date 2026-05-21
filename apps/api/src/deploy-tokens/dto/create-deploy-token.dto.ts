import { IsString, IsUUID } from 'class-validator';

export class CreateDeployTokenDto {
  @IsUUID()
  environmentId: string;

  @IsString()
  tokenHash: string;

  @IsString()
  tokenWrappedDEK: string;
}
