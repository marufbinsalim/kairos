import { x25519 } from '@noble/curves/ed25519';
import * as bip39 from 'bip39';

export function generateRecoveryMnemonic(): string {
  return bip39.generateMnemonic();
}

function normalizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().toLowerCase().split(/\s+/).join(' ');
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(normalizeMnemonic(mnemonic));
}

export async function wrapPrivateKeyWithMnemonic(privateKey: Uint8Array, mnemonic: string): Promise<string> {
  return encryptPrivateKeyWithPassword(privateKey, normalizeMnemonic(mnemonic));
}

export async function unwrapPrivateKeyWithMnemonic(blob: string, mnemonic: string): Promise<Uint8Array> {
  return decryptPrivateKeyWithPassword(blob, normalizeMnemonic(mnemonic));
}

export function generateKeypair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
  const privateKey = x25519.utils.randomPrivateKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

export function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function base64ToBytes(b64: string): Uint8Array {
  return new Uint8Array(atob(b64).split('').map((c) => c.charCodeAt(0)));
}

function toBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

async function deriveWrapKey(password: string, salt: Uint8Array, usage: KeyUsage): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: toBuffer(salt), iterations: 600000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage],
  );
}

export async function encryptPrivateKeyWithPassword(
  privateKey: Uint8Array,
  password: string,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrapKey = await deriveWrapKey(password, salt, 'encrypt');
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrapKey, toBuffer(privateKey)));
  const blob = new Uint8Array(16 + 12 + ciphertext.byteLength);
  blob.set(salt, 0);
  blob.set(iv, 16);
  blob.set(ciphertext, 28);
  return bytesToBase64(blob);
}

export async function decryptPrivateKeyWithPassword(
  encryptedBlob: string,
  password: string,
): Promise<Uint8Array> {
  const blob = base64ToBytes(encryptedBlob);
  const salt = blob.slice(0, 16);
  const iv = blob.slice(16, 28);
  const ciphertext = blob.slice(28);
  const wrapKey = await deriveWrapKey(password, salt, 'decrypt');
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toBuffer(iv) }, wrapKey, toBuffer(ciphertext));
  return new Uint8Array(plaintext);
}
