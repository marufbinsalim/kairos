import { bytesToBase64, base64ToBytes } from '../crypto/keypair';

/**
 * Per-account vault storage, namespaced by userId so each account's key
 * survives other accounts signing in on the same browser.
 *
 * The device private key lives in localStorage so this browser stays a
 * trusted device across sessions — with Google-only sign-in there is no
 * password to re-derive it from. Signing out keeps the key; only clearing
 * site data removes it, after which the recovery phrase is needed.
 *
 * Reads fall back to the pre-namespacing keys (`kairos_privkey` etc.) so
 * existing devices migrate seamlessly — callers always verify the key
 * against the account's public key before trusting it.
 */
const PRIVKEY_PREFIX = 'kairos_privkey';
const DEVICE_ID_PREFIX = 'kairos_deviceId';
const KEYS_VERSION_PREFIX = 'kairos_keysVersion';

function scoped(prefix: string, userId: string): string {
  return `${prefix}:${userId}`;
}

export function savePrivateKeyLocal(userId: string, privateKey: Uint8Array): void {
  localStorage.setItem(scoped(PRIVKEY_PREFIX, userId), bytesToBase64(privateKey));
}

export function loadPrivateKeyLocal(userId: string): Uint8Array | null {
  const stored =
    localStorage.getItem(scoped(PRIVKEY_PREFIX, userId)) ??
    localStorage.getItem(PRIVKEY_PREFIX) ??
    sessionStorage.getItem(PRIVKEY_PREFIX);
  if (!stored) return null;
  try {
    return base64ToBytes(stored);
  } catch {
    return null;
  }
}

export function saveDeviceIdLocal(userId: string, deviceId: string): void {
  localStorage.setItem(scoped(DEVICE_ID_PREFIX, userId), deviceId);
}

export function loadDeviceIdLocal(userId: string): string | null {
  return (
    localStorage.getItem(scoped(DEVICE_ID_PREFIX, userId)) ??
    localStorage.getItem(DEVICE_ID_PREFIX) ??
    sessionStorage.getItem(DEVICE_ID_PREFIX)
  );
}

/** Server-side keysVersion this browser last verified the phrase against.
 *  When the account's version moves past it (phrase regenerated elsewhere),
 *  the vault locks until the new phrase is entered. */
export function saveKeysVersionLocal(userId: string, version: number): void {
  localStorage.setItem(scoped(KEYS_VERSION_PREFIX, userId), String(version));
}

export function loadKeysVersionLocal(userId: string): number | null {
  const v =
    localStorage.getItem(scoped(KEYS_VERSION_PREFIX, userId)) ??
    localStorage.getItem(KEYS_VERSION_PREFIX);
  return v ? Number(v) : null;
}
