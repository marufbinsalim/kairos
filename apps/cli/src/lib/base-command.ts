import { Command } from '@oclif/core';
import { api } from './api';
import { loadAuth, loadConfig, saveConfig } from './config';

export abstract class BaseCommand extends Command {
  async init() {
    await super.init();
    await syncLocalState();
  }
}

async function syncLocalState() {
  const auth = loadAuth();
  if (!auth?.accessToken) return;

  const config = loadConfig();
  const storedIds = config.deviceIds ?? (config.deviceId ? [config.deviceId] : []);
  if (!storedIds.length && !config.defaultEnvironmentId) return;

  try {
    const updates: Record<string, unknown> = {};
    let changed = false;

    if (storedIds.length) {
      const activeDevices = await api.get<Array<{ id: string }>>('/devices');
      const activeSet = new Set(activeDevices.map((d) => d.id));
      const validIds = storedIds.filter((id) => activeSet.has(id));

      if (validIds.length !== storedIds.length) {
        changed = true;
        updates.deviceIds = validIds;
        updates.deviceId = activeSet.has(config.deviceId ?? '') ? config.deviceId : validIds[0];
        updates.deviceEnvMap = Object.fromEntries(
          Object.entries(config.deviceEnvMap ?? {}).filter(([, devId]) => activeSet.has(devId as string)),
        );
      }
    }

    if (config.defaultEnvironmentId) {
      const envs = await api.get<Array<{ id: string }>>('/environments');
      const envSet = new Set(envs.map((e) => e.id));
      if (!envSet.has(config.defaultEnvironmentId)) {
        changed = true;
        updates.defaultEnvironmentId = undefined;
        updates.defaultEnvName = undefined;
        updates.defaultProjectName = undefined;
      }
    }

    if (changed) saveConfig(updates as any);
  } catch {
    // network unavailable — proceed without syncing
  }
}
