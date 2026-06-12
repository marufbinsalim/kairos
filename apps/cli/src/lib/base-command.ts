import { Command } from '@oclif/core';
import chalk from 'chalk';
import { api, ApiError } from './api';
import { loadAuth, loadConfig, saveConfig } from './config';
import { loadPrivateKey } from './keystore';
import { publicKeyFromPrivate, bytesToBase64 } from './crypto';
import { notice, stopSpinner, sym } from './ui';

let calibratedThisProcess = false;

export abstract class BaseCommand extends Command {
  /** Commands that must work with broken auth or no network (login, logout, update). */
  protected static skipCalibration = false;

  async init() {
    await super.init();
    const ctor = this.constructor as typeof BaseCommand & { skipCalibration: boolean };
    if (ctor.skipCalibration || calibratedThisProcess) return;
    // No network round-trips for help or deploy-token (CI) invocations
    if (this.argv.includes('--help') || this.argv.includes('-h')) return;
    if (this.argv.includes('--token') || this.argv.includes('-t') || process.env.KAIROS_TOKEN) return;
    calibratedThisProcess = true;
    await calibrateLocalState();
  }

  /** Render errors as a clean ✖ line with an optional "Run <cmd>" suggestion — no stack traces. */
  async catch(error: unknown): Promise<never> {
    const e = error as { code?: string; message?: string; hint?: string };
    if (e?.code === 'EEXIT') throw error as Error; // this.exit() — not a failure
    stopSpinner();
    console.log();
    console.log('  ' + chalk.red(sym.err) + ' ' + chalk.white(e?.message ?? String(error)));
    if (e?.hint) console.log('  ' + chalk.dim(sym.arrow + ' Run ') + chalk.cyan(e.hint));
    console.log();
    process.exit(1);
  }
}

interface ServerDevice {
  id: string;
  publicKey: string;
  status?: string;
}

interface ServerEnv {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
}

/**
 * Reconcile local state with the server before every command:
 *  - drop device registrations that were revoked/deleted server-side
 *  - drop registrations whose server public key no longer matches our local key
 *    (key was regenerated — wrapped DEKs are undecryptable)
 *  - keep registrations that are still pending approval
 *  - clear the active environment if it was deleted; sync renames otherwise
 *  - prune deviceEnvMap entries pointing at deleted envs or purged devices
 */
async function calibrateLocalState(): Promise<void> {
  const auth = loadAuth();
  if (!auth?.accessToken) return;

  const config = loadConfig();
  const storedIds = config.deviceIds ?? (config.deviceId ? [config.deviceId] : []);
  if (!storedIds.length && !config.defaultEnvironmentId) return;

  let active: ServerDevice[];
  let pending: ServerDevice[];
  let envs: ServerEnv[];
  try {
    [active, pending, envs] = await Promise.all([
      api.get<ServerDevice[]>('/devices'),
      api.get<ServerDevice[]>('/devices/pending').catch(() => [] as ServerDevice[]),
      api.get<ServerEnv[]>('/environments'),
    ]);
  } catch (e) {
    // Expired session must surface immediately; anything else (offline, 5xx) → proceed silently
    if (e instanceof ApiError && e.status === 401) throw e;
    return;
  }

  const serverKeys = new Map<string, string>();
  for (const d of [...active, ...pending]) serverKeys.set(d.id, d.publicKey);

  const notices: string[] = [];
  const updates: Record<string, unknown> = {};
  let changed = false;

  let validIds = storedIds;
  if (storedIds.length) {
    const privateKey = loadPrivateKey();
    const localPub = privateKey ? bytesToBase64(publicKeyFromPrivate(privateKey)) : null;

    validIds = storedIds.filter((id) => serverKeys.get(id) === localPub && localPub !== null);

    const removed = storedIds.length - validIds.length;
    if (removed > 0) {
      changed = true;
      const plural = removed !== 1;
      if (!localPub) {
        notices.push(`Local device key is missing — cleared ${removed} unusable registration${plural ? 's' : ''}.`);
      } else if (storedIds.some((id) => serverKeys.has(id) && serverKeys.get(id) !== localPub)) {
        notices.push(`Device key changed — cleared ${removed} stale registration${plural ? 's' : ''}.`);
      } else {
        notices.push(`${removed} device registration${plural ? 's were' : ' was'} revoked — removed locally.`);
      }
      updates.deviceIds = validIds;
      updates.deviceId = validIds.includes(config.deviceId ?? '') ? config.deviceId : validIds[0];
    }
  }

  // Prune deviceEnvMap of deleted environments / purged devices
  const envIdSet = new Set(envs.map((e) => e.id));
  const validIdSet = new Set(validIds);
  const oldMap = config.deviceEnvMap ?? {};
  const newMap = Object.fromEntries(
    Object.entries(oldMap).filter(([envId, devId]) => envIdSet.has(envId) && validIdSet.has(devId)),
  );
  if (Object.keys(newMap).length !== Object.keys(oldMap).length) {
    changed = true;
    updates.deviceEnvMap = newMap;
  }

  // Active environment: clear if deleted, otherwise sync renamed names/project
  if (config.defaultEnvironmentId) {
    const env = envs.find((e) => e.id === config.defaultEnvironmentId);
    if (!env) {
      changed = true;
      updates.defaultEnvironmentId = undefined;
      updates.defaultEnvName = undefined;
      updates.defaultProjectId = undefined;
      updates.defaultProjectName = undefined;
      notices.push('Active environment was deleted.');
    } else {
      if (env.name !== config.defaultEnvName) {
        changed = true;
        updates.defaultEnvName = env.name;
      }
      if (env.projectId !== config.defaultProjectId) {
        changed = true;
        updates.defaultProjectId = env.projectId;
      }
      if ((env.projectName ?? '') !== (config.defaultProjectName ?? '')) {
        changed = true;
        updates.defaultProjectName = env.projectName ?? '';
      }
    }
  }

  // If every registration is gone, the selected environment can't be decrypted anymore
  if (
    storedIds.length > 0 &&
    validIds.length === 0 &&
    config.defaultEnvironmentId &&
    !('defaultEnvironmentId' in updates)
  ) {
    changed = true;
    updates.defaultEnvironmentId = undefined;
    updates.defaultEnvName = undefined;
    updates.defaultProjectId = undefined;
    updates.defaultProjectName = undefined;
  }

  if (changed) saveConfig(updates as Parameters<typeof saveConfig>[0]);
  if (notices.length) {
    for (const n of notices) notice(n);
    notice('Run kairos switch to re-link this machine.');
  }
}
