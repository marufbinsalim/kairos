import { Command, Args } from '@oclif/core';
import { api } from '../lib/api';
import { loadConfig, saveConfig, loadAuth } from '../lib/config';
import { ok } from '../lib/ui';
import chalk from 'chalk';

export default class Name extends Command {
  static description = 'Set a name for this device';
  static args = {
    name: Args.string({ required: true, description: 'Device name' }),
  };

  async run() {
    const { args } = await this.parse(Name);
    const auth = loadAuth();
    if (!auth) this.error('Not logged in. Run: kairos login');
    const config = loadConfig();

    const deviceIds = config.deviceIds ?? (config.deviceId ? [config.deviceId] : []);
    if (!deviceIds.length) this.error('No devices registered. Run: kairos switch first.');

    const label = `CLI on ${process.platform} - "${args.name}"`;
    await Promise.all(deviceIds.map((id) => api.patch(`/devices/${id}/label`, { label }).catch(() => {})));
    saveConfig({ deviceName: args.name });

    console.log();
    ok(`Device named: ${chalk.cyan(args.name)}`);
    console.log();
  }
}
