import { randomBytes } from 'crypto';
import * as bip39 from 'bip39';

export function generateRecoveryKey(): { bytes: Uint8Array; mnemonic: string } {
  const bytes = new Uint8Array(randomBytes(32));
  const mnemonic = bip39.entropyToMnemonic(Buffer.from(bytes).toString('hex'));
  return { bytes, mnemonic };
}

export function mnemonicToRecoveryKey(mnemonic: string): Uint8Array {
  const hex = bip39.mnemonicToEntropy(mnemonic);
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

export function isValidMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}
