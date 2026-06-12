import { IsString, Length } from 'class-validator';

export class CliPollDto {
  @IsString()
  @Length(64, 64)
  pollSecret: string;
}
