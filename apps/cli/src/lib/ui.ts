import chalk from 'chalk';
import { loadConfig, loadAuth } from './config';

export function header(): void {
  const config = loadConfig();
  const auth = loadAuth();

  const parts: string[] = [chalk.bold.cyan('kairos')];

  if (auth?.email) parts.push(chalk.white(auth.email));

  if (config.defaultProjectName && config.defaultEnvName) {
    parts.push(chalk.green(`${config.defaultProjectName} ${chalk.dim('›')} ${config.defaultEnvName}`));
  } else if (config.defaultEnvName) {
    parts.push(chalk.green(config.defaultEnvName));
  }

  const sep = chalk.dim(' │ ');
  console.log('\n' + chalk.dim(' ▸ ') + parts.join(sep) + '\n');
}

export function ok(msg: string): void {
  console.log(chalk.green('  ✔  ') + chalk.white(msg));
}

export function info(msg: string): void {
  console.log(chalk.cyan('  ℹ  ') + chalk.white(msg));
}

export function warn(msg: string): void {
  console.log(chalk.yellow('  ⚠  ') + chalk.yellow(msg));
}

export function err(msg: string): void {
  console.log(chalk.red('  ✖  ') + chalk.red(msg));
}

export function label(key: string, value: string): void {
  console.log('  ' + chalk.dim(key.padEnd(24)) + chalk.white(value));
}

export function row(cols: string[], widths: number[]): void {
  const line = cols.map((c, i) => c.padEnd(widths[i] ?? 0)).join('  ');
  console.log('  ' + line);
}

export function divider(): void {
  console.log(chalk.dim('  ' + '─'.repeat(60)));
}

export function dot(): void {
  process.stdout.write(chalk.dim('.'));
}
