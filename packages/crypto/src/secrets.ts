import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { bytesToBase64, base64ToBytes } from './keypair';

export function encryptSecret(dek: Uint8Array, plaintext: string): { encryptedValue: string; iv: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(dek), iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plaintext, 'utf8')),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([encrypted, authTag]);
  return {
    encryptedValue: bytesToBase64(new Uint8Array(combined)),
    iv: bytesToBase64(new Uint8Array(iv)),
  };
}

export function decryptSecret(dek: Uint8Array, encryptedValue: string, iv: string): string {
  const combined = base64ToBytes(encryptedValue);
  const ivBytes = base64ToBytes(iv);
  const authTag = combined.slice(combined.length - 16);
  const ciphertext = combined.slice(0, combined.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(dek), ivBytes);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
