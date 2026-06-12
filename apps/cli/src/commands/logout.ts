import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { BaseCommand } from '../lib/base-command';
import { api } from '../lib/api';
import { loadConfig, loadAuth, clearAuth } from '../lib/config';
import { ok, info, spinner } from '../lib/ui';

const CONFIG_DIR = process.platform === 'win32'
  ? join(process.env.APPDATA ?? homedir(), 'kairos')
  : join(homedir(), '.config', 'kairos');

export default class Logout extends BaseCommand {
  static description = 'Log out, revoke all CLI devices, and wipe local data';
  protected static skipCalibration = true;

  async run() {
    const auth = loadAuth();
    const config = loadConfig();

    if (!auth?.accessToken && !existsSync(join(CONFIG_DIR, 'config.json'))) {
      console.log();
      info('Already logged out — nothing to do.');
      console.log();
      return;
    }

    console.log();
    if (auth?.accessToken) {
      const deviceIds = config.deviceIds ?? (config.deviceId ? [config.deviceId] : []);
      if (deviceIds.length) {
        const spin = spinner(`Revoking ${deviceIds.length} device registration${deviceIds.length !== 1 ? 's' : ''}…`);
        await Promise.all(deviceIds.map((id) => api.delete(`/devices/${id}`).catch(() => {})));
        spin.succeed(`Revoked ${deviceIds.length} device registration${deviceIds.length !== 1 ? 's' : ''}`);
      }
    }

    clearAuth();
    for (const file of ['config.json', 'device.key']) {
      const p = join(CONFIG_DIR, file);
      if (existsSync(p)) unlinkSync(p);
    }

    ok('Local keys, config, and session wiped');
    console.log();
    console.log('  ' + chalk.dim('Signed out. Run ') + chalk.cyan('kairos login') + chalk.dim(' to start again.'));
    console.log();
  }
}
