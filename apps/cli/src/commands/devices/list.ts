import { Command } from '@oclif/core';
import { api } from '../../lib/api';
import { loadConfig } from '../../lib/config';
import { header, divider } from '../../lib/ui';
import chalk from 'chalk';

export default class DevicesList extends Command {
  static description = 'List registered devices';

  async run() {
    const devices = await api.get<Array<{ id: string; type: string; label: string; status: string; createdAt: string }>>('/devices');
    const config = loadConfig();

    header();

    if (!devices.length) {
      console.log(chalk.dim('  No active devices.\n'));
      return;
    }

    divider();
    for (const d of devices) {
      const isThis = d.id === config.deviceId;
      const statusColor = d.status === 'active' ? chalk.green : d.status === 'pending' ? chalk.yellow : chalk.red;
      const dot = d.status === 'active' ? chalk.green('●') : d.status === 'pending' ? chalk.yellow('◌') : chalk.red('○');

      console.log(
        `  ${dot}  ${chalk.bold(d.label ?? d.type).padEnd(30)}` +
        `${statusColor(d.status).padEnd(20)}` +
        `${chalk.dim(new Date(d.createdAt).toLocaleDateString())}` +
        (isThis ? '  ' + chalk.cyan('[this device]') : ''),
      );
    }
    divider();
    console.log(chalk.dim(`  ${devices.length} device${devices.length !== 1 ? 's' : ''}\n`));
  }
}
