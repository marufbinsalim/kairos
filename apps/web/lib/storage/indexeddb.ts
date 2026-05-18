import { get, set, del } from 'idb-keyval';
import { bytesToBase64, base64ToBytes } from '../crypto/keypair';

const PRIVATE_KEY_IDB_KEY = 'kairos_private_key';
const SALT_LS_KEY = 'kairos_idb_salt';

async function deriveIDBKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function getOrCreateSalt(): Uint8Array {
  const stored = localStorage.getItem(SALT_LS_KEY);
  if (stored) return base64ToBytes(stored);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_LS_KEY, bytesToBase64(salt));
  return salt;
}

export async function storePrivateKey(privateKey: Uint8Array, password: string): Promise<void> {
  const salt = getOrCreateSalt();
  const encKey = await deriveIDBKey(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encKey, privateKey);
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), 12);
  await set(PRIVATE_KEY_IDB_KEY, bytesToBase64(combined));
}

export async function loadPrivateKey(password: string): Promise<Uint8Array | null> {
  const stored = await get<string>(PRIVATE_KEY_IDB_KEY);
  if (!stored) return null;
  const salt = getOrCreateSalt();
  const encKey = await deriveIDBKey(password, salt);
  const combined = base64ToBytes(stored);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, encKey, ciphertext);
    return new Uint8Array(decrypted);
  } catch {
    return null;
  }
}

export async function clearPrivateKey(): Promise<void> {
  await del(PRIVATE_KEY_IDB_KEY);
}
