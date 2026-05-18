import { Command } from '@oclif/core';
import { api } from '../../lib/api';
import { loadConfig } from '../../lib/config';
import { header, divider } from '../../lib/ui';
import chalk from 'chalk';

export default class ProjectsList extends Command {
  static description = 'List projects';

  async run() {
    const projects = await api.get<Array<{ id: string; name: string; createdAt: string }>>('/projects');
    const config = loadConfig();

    header();

    if (!projects.length) {
      console.log(chalk.dim('  No projects yet. Create one in the web UI.\n'));
      return;
    }

    divider();
    for (const p of projects) {
      const isCurrent = p.id === config.defaultProjectId;
      console.log(
        `  ${isCurrent ? chalk.cyan('▶') : chalk.dim('·')}  ${chalk.bold(p.name).padEnd(30)}` +
        chalk.dim(p.id.slice(0, 8) + '…') +
        (isCurrent ? '  ' + chalk.cyan('[selected]') : ''),
      );
    }
    divider();
    console.log(chalk.dim(`  ${projects.length} project${projects.length !== 1 ? 's' : ''}\n`));
  }
}
