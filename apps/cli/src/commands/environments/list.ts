import { BaseCommand } from '../../lib/base-command';
import { api } from '../../lib/api';
import { loadConfig } from '../../lib/config';
import { header, divider } from '../../lib/ui';
import chalk from 'chalk';

export default class EnvironmentsList extends BaseCommand {
  static description = 'List all environments across all projects';

  async run() {
    const envs = await api.get<Array<{ id: string; name: string; projectName?: string }>>('/environments');
    const config = loadConfig();

    header();

    if (!envs.length) {
      console.log(chalk.dim('  No environments yet. Create one in the web UI.\n'));
      return;
    }

    const byProject = new Map<string, typeof envs>();
    for (const e of envs) {
      const key = e.projectName ?? 'Unknown Project';
      if (!byProject.has(key)) byProject.set(key, []);
      byProject.get(key)!.push(e);
    }

    divider();
    for (const [projectName, projectEnvs] of byProject) {
      console.log(`  ${chalk.dim('project')} ${chalk.bold(projectName)}`);
      for (const e of projectEnvs) {
        const isCurrent = e.id === config.defaultEnvironmentId;
        console.log(
          `    ${isCurrent ? chalk.cyan('▶') : chalk.dim('·')}  ${chalk.bold(e.name).padEnd(28)}` +
          chalk.dim(e.id.slice(0, 8) + '…') +
          (isCurrent ? '  ' + chalk.cyan('[active]') : ''),
        );
      }
    }
    divider();
    console.log(chalk.dim(`  ${envs.length} environment${envs.length !== 1 ? 's' : ''}\n`));
  }
}
