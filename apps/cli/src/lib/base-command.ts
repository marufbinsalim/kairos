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
      const envs = await api.get<Array<{ id: string; name: string; projectId: string }>>('/environments');
      const env = envs.find((e) => e.id === config.defaultEnvironmentId);
      if (!env) {
        changed = true;
        updates.defaultEnvironmentId = undefined;
        updates.defaultEnvName = undefined;
        updates.defaultProjectName = undefined;
        updates.defaultProjectId = undefined;
      } else {
        // sync names in case they were renamed
        if (env.name !== config.defaultEnvName) {
          changed = true;
          updates.defaultEnvName = env.name;
        }
        if (env.projectId !== config.defaultProjectId) {
          changed = true;
          updates.defaultProjectId = env.projectId;
        }
        if (config.defaultProjectId || env.projectId) {
          const projects = await api.get<Array<{ id: string; name: string }>>('/projects');
          const project = projects.find((p) => p.id === (env.projectId ?? config.defaultProjectId));
          if (project && project.name !== config.defaultProjectName) {
            changed = true;
            updates.defaultProjectName = project.name;
          }
        }
      }
    }

    if (changed) saveConfig(updates as any);
  } catch {
    // network unavailable — proceed without syncing
  }
}
