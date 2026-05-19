import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = process.platform === 'win32'
  ? join(process.env.APPDATA ?? homedir(), 'kairos')
  : join(homedir(), '.config', 'kairos');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');
const AUTH_PATH = join(CONFIG_DIR, 'auth.json');

function ensureDir() {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
}

interface KairosConfig {
  apiUrl: string;
  deviceId?: string;
  deviceIds?: string[];
  deviceEnvMap?: Record<string, string>;
  deviceName?: string;
  defaultEnvironmentId?: string;
  defaultProjectId?: string;
  defaultProjectName?: string;
  defaultEnvName?: string;
}

interface AuthData {
  accessToken: string;
  userId: string;
  email?: string;
}

export function loadConfig(): KairosConfig {
  if (!existsSync(CONFIG_PATH)) return { apiUrl: 'https://kairos-api-chi.vercel.app' };
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

export function saveConfig(config: Partial<KairosConfig>): void {
  ensureDir();
  const existing = loadConfig();
  writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, ...config }, null, 2));
}

export function loadAuth(): AuthData | null {
  if (!existsSync(AUTH_PATH)) return null;
  return JSON.parse(readFileSync(AUTH_PATH, 'utf8'));
}

export function saveAuth(data: AuthData): void {
  ensureDir();
  writeFileSync(AUTH_PATH, JSON.stringify(data), { mode: 0o600 });
}

export function clearAuth(): void {
  if (existsSync(AUTH_PATH)) {
    writeFileSync(AUTH_PATH, '{}', { mode: 0o600 });
  }
}
