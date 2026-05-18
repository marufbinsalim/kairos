import { x25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToBase64, base64ToBytes } from './keypair';

export function generateDEK(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

async function deriveWrapKey(ikm: Uint8Array, salt: Uint8Array, info: string): Promise<CryptoKey> {
  const derived = hkdf(sha256, ikm, salt, new TextEncoder().encode(info), 32);
  return crypto.subtle.importKey('raw', derived, { name: 'AES-GCM' }, false, ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt']);
}

async function aesGcmEncryptBytes(key: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const result = new Uint8Array(12 + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), 12);
  return result;
}

async function aesGcmDecryptBytes(key: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new Uint8Array(decrypted);
}

export async function selfWrapDEK(privateKey: Uint8Array, dek: Uint8Array): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyHash = sha256(privateKey);
  const wrapKey = await deriveWrapKey(new Uint8Array(keyHash), salt, 'self-wrap-v1');
  const wrapped = await aesGcmEncryptBytes(wrapKey, dek);
  const result = new Uint8Array(16 + wrapped.byteLength);
  result.set(salt, 0);
  result.set(wrapped, 16);
  return bytesToBase64(result);
}

export async function selfUnwrapDEK(privateKey: Uint8Array, wrapped: string): Promise<Uint8Array> {
  const buf = base64ToBytes(wrapped);
  const salt = buf.slice(0, 16);
  const data = buf.slice(16);
  const keyHash = sha256(privateKey);
  const wrapKey = await deriveWrapKey(new Uint8Array(keyHash), salt, 'self-wrap-v1');
  return aesGcmDecryptBytes(wrapKey, data);
}

export async function wrapDEKForDevice(
  myPrivateKey: Uint8Array,
  theirPublicKey: Uint8Array,
  dek: Uint8Array,
): Promise<string> {
  const sharedSecret = x25519.getSharedSecret(myPrivateKey, theirPublicKey);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wrapKey = await deriveWrapKey(new Uint8Array(sharedSecret), salt, 'dek-wrapping-v1');
  const wrapped = await aesGcmEncryptBytes(wrapKey, dek);
  const result = new Uint8Array(16 + wrapped.byteLength);
  result.set(salt, 0);
  result.set(wrapped, 16);
  return bytesToBase64(result);
}

export async function unwrapDEKFromDevice(
  myPrivateKey: Uint8Array,
  theirPublicKey: Uint8Array,
  wrapped: string,
): Promise<Uint8Array> {
  const buf = base64ToBytes(wrapped);
  const salt = buf.slice(0, 16);
  const data = buf.slice(16);
  const sharedSecret = x25519.getSharedSecret(myPrivateKey, theirPublicKey);
  const wrapKey = await deriveWrapKey(new Uint8Array(sharedSecret), salt, 'dek-wrapping-v1');
  return aesGcmDecryptBytes(wrapKey, data);
}
