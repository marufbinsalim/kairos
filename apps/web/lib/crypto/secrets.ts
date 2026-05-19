import { bytesToBase64, base64ToBytes } from './keypair';

function toBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

export async function encryptSecret(
  dek: Uint8Array,
  plaintext: string,
): Promise<{ encryptedValue: string; iv: string }> {
  const key = await crypto.subtle.importKey('raw', toBuffer(dek), { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return {
    encryptedValue: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
}

export async function decryptSecret(
  dek: Uint8Array,
  encryptedValue: string,
  iv: string,
): Promise<string> {
  const key = await crypto.subtle.importKey('raw', toBuffer(dek), { name: 'AES-GCM' }, false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toBuffer(base64ToBytes(iv)) },
    key,
    toBuffer(base64ToBytes(encryptedValue)),
  );
  return new TextDecoder().decode(decrypted);
}
