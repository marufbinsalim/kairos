import { IsString, MinLength } from 'class-validator';

export class CreateEnvironmentDto {
  @IsString()
  @MinLength(1)
  name: string;
}
