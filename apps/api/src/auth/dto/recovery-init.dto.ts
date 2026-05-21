import { IsEmail } from 'class-validator';

export class RecoveryInitDto {
  @IsEmail()
  email: string;
}
