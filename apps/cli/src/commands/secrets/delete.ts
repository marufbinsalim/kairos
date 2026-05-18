import { Command, Flags, Args } from '@oclif/core';
import { api } from '../../lib/api';
import { loadConfig, loadAuth } from '../../lib/config';
import { header, ok } from '../../lib/ui';
import chalk from 'chalk';

export default class SecretsDelete extends Command {
  static description = 'Delete a secret by key';
  static args = { key: Args.string({ required: true, description: 'Secret key name' }) };
  static flags = { env: Flags.string({ char: 'e', description: 'Environment ID' }) };

  async run() {
    const { args, flags } = await this.parse(SecretsDelete);
    const auth = loadAuth();
    if (!auth) this.error('Not logged in.');
    const config = loadConfig();
    const envId = flags.env ?? config.defaultEnvironmentId;
    if (!envId) this.error('No environment selected. Run: kairos sync');

    await api.delete(`/environments/${envId}/secrets/${args.key}`);

    header();
    ok(`${chalk.cyan(args.key)} deleted`);
    console.log();
  }
}
