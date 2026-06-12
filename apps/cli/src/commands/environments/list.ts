import chalk from 'chalk';
import { BaseCommand } from '../../lib/base-command';
import { api } from '../../lib/api';
import { loadConfig } from '../../lib/config';
import { header, divider, spinner, nextSteps, sym } from '../../lib/ui';

export default class EnvironmentsList extends BaseCommand {
  static description = 'List all environments across all projects';

  async run() {
    const spin = spinner('Loading environments…');
    let envs: Array<{ id: string; name: string; projectName?: string }>;
    try {
      envs = await api.get('/environments');
    } catch (e) {
      spin.stop();
      throw e;
    }
    spin.stop();

    const config = loadConfig();

    header();

    if (!envs.length) {
      console.log(chalk.dim('  No environments yet. Create one in the web dashboard.'));
      console.log();
      return;
    }

    const byProject = new Map<string, typeof envs>();
    for (const e of envs) {
      const key = e.projectName ?? 'Unknown project';
      if (!byProject.has(key)) byProject.set(key, []);
      byProject.get(key)!.push(e);
    }

    divider();
    let first = true;
    for (const [projectName, projectEnvs] of byProject) {
      if (!first) console.log();
      first = false;
      console.log('  ' + chalk.bold.white(projectName));
      for (const e of projectEnvs) {
        const isActive = e.id === config.defaultEnvironmentId;
        console.log(
          '    ' +
            (isActive ? chalk.green(sym.on) : chalk.dim(sym.off)) +
            ' ' +
            (isActive ? chalk.bold.green(e.name.padEnd(28)) : chalk.white(e.name.padEnd(28))) +
            chalk.dim(e.id.slice(0, 8) + '…') +
            (isActive ? chalk.green('  active') : ''),
        );
      }
    }
    divider();
    console.log('  ' + chalk.dim(`${envs.length} environment${envs.length !== 1 ? 's' : ''}`));
    console.log();
    nextSteps([['kairos switch', 'change the active environment']]);
    console.log();
  }
}
