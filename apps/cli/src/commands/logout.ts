import { Command } from '@oclif/core';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { api } from '../lib/api';
import { loadConfig, loadAuth, clearAuth } from '../lib/config';
import { ok, info } from '../lib/ui';

const CONFIG_DIR = process.platform === 'win32'
  ? join(process.env.APPDATA ?? homedir(), 'kairos')
  : join(homedir(), '.config', 'kairos');

export default class Logout extends Command {
  static description = 'Log out and revoke all CLI devices';

  async run() {
    const auth = loadAuth();
    const config = loadConfig();

    if (auth?.accessToken) {
      const deviceIds = config.deviceIds ?? (config.deviceId ? [config.deviceId] : []);
      if (deviceIds.length) {
        info(`Revoking ${deviceIds.length} device${deviceIds.length !== 1 ? 's' : ''}…`);
        await Promise.all(
          deviceIds.map((id) => api.delete(`/devices/${id}`).catch(() => {}))
        );
      }
    }

    // Wipe all local data
    clearAuth();
    for (const file of ['config.json', 'device.key']) {
      const p = join(CONFIG_DIR, file);
      if (existsSync(p)) unlinkSync(p);
    }

    console.log();
    ok('Logged out. All CLI devices revoked.');
    console.log();
  }
}
