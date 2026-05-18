import { x25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { base64ToBytes, bytesToBase64 } from './keypair';

export function generateDEK(): Uint8Array {
  return new Uint8Array(randomBytes(32));
}

function deriveWrapKey(sharedSecret: Uint8Array, salt: Uint8Array, info: string): Buffer {
  return Buffer.from(hkdf(sha256, sharedSecret, salt, info, 32));
}

function aesGcmEncrypt(key: Buffer, plaintext: Uint8Array): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // base64(iv || ciphertext || authTag)
  return bytesToBase64(new Uint8Array(Buffer.concat([iv, encrypted, authTag])));
}

function aesGcmDecrypt(key: Buffer, encoded: string): Uint8Array {
  const buf = base64ToBytes(encoded);
  const iv = buf.slice(0, 12);
  const authTag = buf.slice(buf.length - 16);
  const ciphertext = buf.slice(12, buf.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return new Uint8Array(Buffer.concat([decipher.update(ciphertext), decipher.final()]));
}

// Wrap DEK for another device using ECDH
export function wrapDEKForDevice(
  myPrivateKey: Uint8Array,
  theirPublicKey: Uint8Array,
  dek: Uint8Array,
): string {
  const sharedSecret = x25519.getSharedSecret(myPrivateKey, theirPublicKey);
  const salt = randomBytes(16);
  const wrapKey = deriveWrapKey(new Uint8Array(sharedSecret), new Uint8Array(salt), 'dek-wrapping-v1');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', wrapKey, iv);
  const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // base64(salt || iv || ciphertext || authTag)
  return bytesToBase64(new Uint8Array(Buffer.concat([new Uint8Array(salt), iv, encrypted, authTag])));
}

// Unwrap DEK using ECDH (receiver side)
export function unwrapDEKFromDevice(
  myPrivateKey: Uint8Array,
  theirPublicKey: Uint8Array,
  wrapped: string,
): Uint8Array {
  const buf = base64ToBytes(wrapped);
  const salt = buf.slice(0, 16);
  const iv = buf.slice(16, 28);
  const authTag = buf.slice(buf.length - 16);
  const ciphertext = buf.slice(28, buf.length - 16);
  const sharedSecret = x25519.getSharedSecret(myPrivateKey, theirPublicKey);
  const wrapKey = deriveWrapKey(new Uint8Array(sharedSecret), new Uint8Array(salt), 'dek-wrapping-v1');
  const decipher = createDecipheriv('aes-256-gcm', wrapKey, iv);
  decipher.setAuthTag(authTag);
  return new Uint8Array(Buffer.concat([decipher.update(ciphertext), decipher.final()]));
}

// Self-wrap: wrap DEK with own private key (for web device registration)
export function selfWrapDEK(privateKey: Uint8Array, dek: Uint8Array): string {
  const salt = randomBytes(16);
  const keyHash = sha256(privateKey);
  const wrapKey = deriveWrapKey(new Uint8Array(keyHash), new Uint8Array(salt), 'self-wrap-v1');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', wrapKey, iv);
  const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // base64(salt || iv || ciphertext || authTag)
  return bytesToBase64(new Uint8Array(Buffer.concat([new Uint8Array(salt), iv, encrypted, authTag])));
}

export function selfUnwrapDEK(privateKey: Uint8Array, wrapped: string): Uint8Array {
  const buf = base64ToBytes(wrapped);
  const salt = buf.slice(0, 16);
  const iv = buf.slice(16, 28);
  const authTag = buf.slice(buf.length - 16);
  const ciphertext = buf.slice(28, buf.length - 16);
  const keyHash = sha256(privateKey);
  const wrapKey = deriveWrapKey(new Uint8Array(keyHash), new Uint8Array(salt), 'self-wrap-v1');
  const decipher = createDecipheriv('aes-256-gcm', wrapKey, iv);
  decipher.setAuthTag(authTag);
  return new Uint8Array(Buffer.concat([decipher.update(ciphertext), decipher.final()]));
}

// Wrap DEK with recovery key (raw bytes, no ECDH)
export function wrapDEKWithRecoveryKey(recoveryKey: Uint8Array, dek: Uint8Array): string {
  return aesGcmEncrypt(Buffer.from(recoveryKey), dek);
}

export function unwrapDEKWithRecoveryKey(recoveryKey: Uint8Array, wrapped: string): Uint8Array {
  return aesGcmDecrypt(Buffer.from(recoveryKey), wrapped);
}
