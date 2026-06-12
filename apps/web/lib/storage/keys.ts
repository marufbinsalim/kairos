import { bytesToBase64, base64ToBytes } from '../crypto/keypair';

const PRIVKEY_KEY = 'kairos_privkey';
const DEVICE_ID_KEY = 'kairos_deviceId';

/**
 * The device private key lives in localStorage so this browser stays a trusted
 * device across sessions — with Google-only sign-in there is no password to
 * re-derive it from. Signing out keeps the key; only "forget this device"
 * (or clearing site data) removes it, after which the recovery phrase is needed.
 */
export function savePrivateKeyLocal(privateKey: Uint8Array): void {
  localStorage.setItem(PRIVKEY_KEY, bytesToBase64(privateKey));
}

export function loadPrivateKeyLocal(): Uint8Array | null {
  const stored = localStorage.getItem(PRIVKEY_KEY) ?? sessionStorage.getItem(PRIVKEY_KEY);
  if (!stored) return null;
  try {
    return base64ToBytes(stored);
  } catch {
    return null;
  }
}

export function clearPrivateKeyLocal(): void {
  localStorage.removeItem(PRIVKEY_KEY);
  sessionStorage.removeItem(PRIVKEY_KEY);
}

export function saveDeviceIdLocal(deviceId: string): void {
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
}

export function loadDeviceIdLocal(): string | null {
  return localStorage.getItem(DEVICE_ID_KEY) ?? sessionStorage.getItem(DEVICE_ID_KEY);
}

export function clearDeviceIdLocal(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
  sessionStorage.removeItem(DEVICE_ID_KEY);
}
