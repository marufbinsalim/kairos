import { IsString, MinLength } from 'class-validator';

export class UpsertSecretDto {
  @IsString()
  @MinLength(1)
  key: string;

  @IsString()
  encryptedValue: string;

  @IsString()
  iv: string;
}
