import { Command, Flags } from '@oclif/core';
import { api } from '../../lib/api';
import { header, ok } from '../../lib/ui';
import chalk from 'chalk';

export default class ProjectsCreate extends Command {
  static description = 'Create a project';
  static flags = { name: Flags.string({ required: true, char: 'n', description: 'Project name' }) };

  async run() {
    const { flags } = await this.parse(ProjectsCreate);
    const project = await api.post<{ id: string; name: string }>('/projects', { name: flags.name });
    header();
    ok(`Project ${chalk.cyan(project.name)} created ${chalk.dim(project.id.slice(0, 8) + '…')}`);
    console.log();
  }
}
