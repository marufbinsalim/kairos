import { Args } from '@oclif/core';
import chalk from 'chalk';
import { BaseCommand } from '../lib/base-command';
import { api } from '../lib/api';
import { loadConfig, saveConfig, loadAuth } from '../lib/config';
import { spinner, CliError } from '../lib/ui';

export default class Device extends BaseCommand {
  static description = 'Set a name for this device';
  static args = {
    name: Args.string({ required: true, description: 'Device name' }),
  };
  static examples = ['kairos device work-laptop'];

  async run() {
    const { args } = await this.parse(Device);
    const auth = loadAuth();
    if (!auth) throw new CliError('Not logged in.', 'kairos login');
    const config = loadConfig();

    const deviceIds = config.deviceIds ?? (config.deviceId ? [config.deviceId] : []);
    if (!deviceIds.length) throw new CliError('This machine has no device registrations yet.', 'kairos switch');

    console.log();
    const spin = spinner('Renaming device…');
    const label = `CLI on ${process.platform} - "${args.name}"`;
    await Promise.all(deviceIds.map((id) => api.patch(`/devices/${id}/label`, { label }).catch(() => {})));
    saveConfig({ deviceName: args.name });

    spin.succeed(`Device renamed to ${chalk.cyan(args.name)}`);
    console.log();
  }
}
