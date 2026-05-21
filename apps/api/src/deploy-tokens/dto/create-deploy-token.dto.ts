import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateDeployTokenDto {
  @IsUUID()
  environmentId: string;

  @IsString()
  tokenHash: string;

  @IsString()
  tokenWrappedDEK: string;

  @IsOptional()
  @IsString()
  label?: string;
}
