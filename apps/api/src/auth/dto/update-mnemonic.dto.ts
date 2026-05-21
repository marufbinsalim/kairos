import { IsString } from 'class-validator';

export class UpdateMnemonicDto {
  @IsString()
  mnemonicEncryptedPrivateKey: string;
}
