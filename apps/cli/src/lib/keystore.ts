import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.config', 'kairos');

function ensureDir() {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
}

const DEVICE_KEY_PATH = join(CONFIG_DIR, 'device.key');

export function savePrivateKey(privateKey: Uint8Array): void {
  ensureDir();
  writeFileSync(DEVICE_KEY_PATH, Buffer.from(privateKey).toString('hex'), { mode: 0o600 });
}

export function loadPrivateKey(): Uint8Array | null {
  if (!existsSync(DEVICE_KEY_PATH)) return null;
  const hex = readFileSync(DEVICE_KEY_PATH, 'utf8').trim();
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

export function hasPrivateKey(): boolean {
  return existsSync(DEVICE_KEY_PATH);
}
