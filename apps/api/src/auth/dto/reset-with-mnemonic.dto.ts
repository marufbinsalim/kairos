import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetWithMnemonicDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsString()
  newEncryptedPrivateKey: string;
}
