import * as bip39 from 'bip39';
import { bytesToBase64, base64ToBytes } from './keypair';

export function generateRecoveryKey(): { bytes: Uint8Array; mnemonic: string } {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const mnemonic = bip39.entropyToMnemonic(hex);
  return { bytes, mnemonic };
}

export function mnemonicToRecoveryKey(mnemonic: string): Uint8Array {
  const hex = bip39.mnemonicToEntropy(mnemonic);
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

export async function wrapDEKWithRecoveryKey(recoveryKey: Uint8Array, dek: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', recoveryKey, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, dek);
  const result = new Uint8Array(12 + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), 12);
  return bytesToBase64(result);
}

export async function unwrapDEKWithRecoveryKey(recoveryKey: Uint8Array, wrapped: string): Promise<Uint8Array> {
  const buf = base64ToBytes(wrapped);
  const iv = buf.slice(0, 12);
  const ciphertext = buf.slice(12);
  const key = await crypto.subtle.importKey('raw', recoveryKey, { name: 'AES-GCM' }, false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new Uint8Array(decrypted);
}
