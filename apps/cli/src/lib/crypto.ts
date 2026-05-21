import { x25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

export function generateKeypair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
  const privateKey = x25519.utils.randomPrivateKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

export function publicKeyFromPrivate(privateKey: Uint8Array): Uint8Array {
  return x25519.getPublicKey(privateKey);
}

export function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export function base64ToBytes(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

export function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

export function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

function deriveWrapKey(ikm: Uint8Array, salt: Uint8Array, info: string): Buffer {
  return Buffer.from(hkdf(sha256, ikm, salt, info, 32));
}

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
  decipher.setAuthTag(Buffer.from(authTag));
  return new Uint8Array(Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()]));
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
  decipher.setAuthTag(Buffer.from(authTag));
  return new Uint8Array(Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()]));
}

export function unwrapDEKWithToken(tokenWrappedDEK: string, tokenBytes: Uint8Array): Uint8Array {
  const buf = base64ToBytes(tokenWrappedDEK);
  const iv = buf.slice(0, 12);
  const authTag = buf.slice(buf.length - 16);
  const ciphertext = buf.slice(12, buf.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(tokenBytes), Buffer.from(iv));
  decipher.setAuthTag(Buffer.from(authTag));
  return new Uint8Array(Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()]));
}

export function encryptSecret(dek: Uint8Array, plaintext: string): { encryptedValue: string; iv: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(dek), iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encryptedValue: bytesToBase64(new Uint8Array(Buffer.concat([encrypted, authTag]))),
    iv: bytesToBase64(new Uint8Array(iv)),
  };
}

export function decryptSecret(dek: Uint8Array, encryptedValue: string, iv: string): string {
  const combined = base64ToBytes(encryptedValue);
  const ivBytes = base64ToBytes(iv);
  const authTag = combined.slice(combined.length - 16);
  const ciphertext = combined.slice(0, combined.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(dek), ivBytes);
  decipher.setAuthTag(Buffer.from(authTag));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()]).toString('utf8');
}
