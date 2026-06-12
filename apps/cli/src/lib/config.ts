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
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as KairosConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: Partial<KairosConfig>): void {
  ensureDir();
  const existing = loadConfig();
  writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, ...config }, null, 2));
}

export function loadAuth(): AuthData | null {
  if (!existsSync(AUTH_PATH)) return null;
  try {
    const data = JSON.parse(readFileSync(AUTH_PATH, 'utf8')) as Partial<AuthData>;
    // A cleared session is written as {} — treat anything without a token as logged out
    if (!data.accessToken) return null;
    return data as AuthData;
  } catch {
    return null;
  }
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
