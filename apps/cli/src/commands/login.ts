import inquirer from 'inquirer';
import chalk from 'chalk';
import { BaseCommand } from '../lib/base-command';
import { api } from '../lib/api';
import { saveAuth, loadAuth } from '../lib/config';
import { spinner, nextSteps, info, sym } from '../lib/ui';

export default class Login extends BaseCommand {
  static description = 'Log in to Kairos';
  protected static skipCalibration = true;

  async run() {
    const existing = loadAuth();
    console.log();
    console.log('  ' + chalk.bold.cyan('kairos') + chalk.dim(` ${sym.bullet} sign in`));
    if (existing?.email) info(`Currently signed in as ${chalk.dim(existing.email)} — signing in again will replace this session.`);
    console.log();

    const { email } = await inquirer.prompt<{ email: string }>([
      {
        type: 'input',
        name: 'email',
        message: 'Email',
        prefix: ' ' + chalk.cyan(sym.pointer),
        validate: (v: string) => /\S+@\S+\.\S+/.test(v.trim()) || 'Enter a valid email address',
        filter: (v: string) => v.trim().toLowerCase(),
      },
    ]);
    const { password } = await inquirer.prompt<{ password: string }>([
      {
        type: 'password',
        name: 'password',
        message: 'Password',
        mask: '•',
        prefix: ' ' + chalk.cyan(sym.pointer),
        validate: (v: string) => v.length > 0 || 'Password is required',
      },
    ]);

    console.log();
    const spin = spinner('Signing in…');
    try {
      const result = await api.post<{ accessToken: string; userId: string }>('/auth/login', {
        email,
        password,
      });
      saveAuth({ accessToken: result.accessToken, userId: result.userId, email });
      spin.succeed(`Signed in as ${chalk.bold(email)}`);
    } catch (e: unknown) {
      const status = (e as { status?: number }).status;
      spin.fail(
        status === 401 || status === 400
          ? 'Invalid email or password.'
          : (e as Error).message,
      );
      this.exit(1);
    }

    console.log();
    nextSteps([
      ['kairos switch', 'pick a project & environment'],
      ['kairos secrets', 'view decrypted secrets'],
      ['kairos run -- <cmd>', 'run a command with secrets injected'],
    ]);
    console.log();
  }
}
