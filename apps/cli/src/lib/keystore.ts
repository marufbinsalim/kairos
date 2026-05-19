import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = process.platform === 'win32'
  ? join(process.env.APPDATA ?? homedir(), 'kairos')
  : join(homedir(), '.config', 'kairos');

// Legacy path used before APPDATA fix (Windows only)
const LEGACY_KEY_PATH = join(homedir(), '.config', 'kairos', 'device.key');

function ensureDir() {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
}

const DEVICE_KEY_PATH = join(CONFIG_DIR, 'device.key');

export function savePrivateKey(privateKey: Uint8Array): void {
  ensureDir();
  writeFileSync(DEVICE_KEY_PATH, Buffer.from(privateKey).toString('hex'), { mode: 0o600 });
}

export function loadPrivateKey(): Uint8Array | null {
  if (!existsSync(DEVICE_KEY_PATH)) {
    // Migrate from legacy path on Windows
    if (process.platform === 'win32' && existsSync(LEGACY_KEY_PATH)) {
      const hex = readFileSync(LEGACY_KEY_PATH, 'utf8').trim();
      ensureDir();
      writeFileSync(DEVICE_KEY_PATH, hex, { mode: 0o600 });
      return new Uint8Array(Buffer.from(hex, 'hex'));
    }
    return null;
  }
  const hex = readFileSync(DEVICE_KEY_PATH, 'utf8').trim();
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

export function hasPrivateKey(): boolean {
  return existsSync(DEVICE_KEY_PATH) || (process.platform === 'win32' && existsSync(LEGACY_KEY_PATH));
}
