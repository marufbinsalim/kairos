import { IsString, MaxLength } from 'class-validator';

export class UpdateLabelDto {
  @IsString()
  @MaxLength(100)
  label: string;
}
