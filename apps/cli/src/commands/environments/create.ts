import { Command, Flags } from '@oclif/core';
import { api } from '../../lib/api';
import { header, ok } from '../../lib/ui';
import chalk from 'chalk';

export default class EnvironmentsCreate extends Command {
  static description = 'Create an environment';
  static flags = {
    project: Flags.string({ required: true, char: 'p', description: 'Project ID' }),
    name: Flags.string({ required: true, char: 'n', description: 'Environment name' }),
  };

  async run() {
    const { flags } = await this.parse(EnvironmentsCreate);
    const env = await api.post<{ id: string; name: string }>(`/projects/${flags.project}/environments`, { name: flags.name });
    header();
    ok(`Environment ${chalk.cyan(env.name)} created ${chalk.dim(env.id.slice(0, 8) + '…')}`);
    console.log();
  }
}
