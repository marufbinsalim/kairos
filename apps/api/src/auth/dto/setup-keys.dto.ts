import { IsString } from 'class-validator';

export class SetupKeysDto {
  @IsString()
  publicKey: string;

  @IsString()
  mnemonicEncryptedPrivateKey: string;
}
