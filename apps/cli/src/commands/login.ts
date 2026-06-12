import chalk from 'chalk';
import { spawn } from 'child_process';
import { BaseCommand } from '../lib/base-command';
import { api } from '../lib/api';
import { saveAuth, loadAuth } from '../lib/config';
import { spinner, nextSteps, info, ok, CliError, sym } from '../lib/ui';

const WEB_URL = process.env.KAIROS_WEB_URL ?? 'https://kairoscli.vercel.app';

function openBrowser(url: string): void {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
    child.on('error', () => {});
    child.unref();
  } catch {
    /* user can open the printed URL manually */
  }
}

interface PollResult {
  status: 'pending' | 'approved' | 'denied' | 'expired';
  accessToken?: string;
  userId?: string;
  email?: string;
}

export default class Login extends BaseCommand {
  static description = 'Sign in with Google via your browser';
  protected static skipCalibration = true;

  async run() {
    const existing = loadAuth();
    console.log();
    console.log('  ' + chalk.bold.cyan('kairos') + chalk.dim(` ${sym.bullet} sign in with Google`));
    if (existing?.email) {
      info(`Currently signed in as ${chalk.dim(existing.email)} — completing this flow will replace the session.`);
    }
    console.log();

    const start = await api.post<{ code: string; pollSecret: string; expiresIn: number }>('/auth/cli/start', {});
    const url = `${WEB_URL}/cli-auth?code=${encodeURIComponent(start.code)}`;

    console.log('  ' + chalk.dim('Confirmation code') + '  ' + chalk.bold.cyan(start.code));
    if (process.env.KAIROS_NO_BROWSER) {
      console.log('  ' + chalk.dim('Visit ') + sym.arrow + ' ' + chalk.cyan(url));
    } else {
      console.log('  ' + chalk.dim('Opening browser ') + sym.arrow + ' ' + chalk.cyan(url));
      console.log('  ' + chalk.dim('If it does not open, visit the link above and approve the request.'));
      openBrowser(url);
    }
    console.log();

    const spin = spinner('Waiting for approval in the browser…');
    const deadline = Date.now() + start.expiresIn * 1000;

    while (true) {
      await new Promise((r) => setTimeout(r, 3000));
      if (Date.now() > deadline) {
        spin.fail('The sign-in code expired.');
        throw new CliError('Sign-in timed out.', 'kairos login');
      }
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      spin.update(`Waiting for approval in the browser… ${chalk.dim(`${remaining}s left`)}`);

      let result: PollResult;
      try {
        result = await api.post<PollResult>('/auth/cli/poll', { pollSecret: start.pollSecret });
      } catch {
        continue; // transient network error — keep polling
      }

      if (result.status === 'pending') continue;
      if (result.status === 'denied') {
        spin.fail('Sign-in was denied in the browser.');
        this.exit(1);
      }
      if (result.status === 'expired') {
        spin.fail('The sign-in code expired.');
        throw new CliError('Sign-in timed out.', 'kairos login');
      }

      // approved
      saveAuth({ accessToken: result.accessToken!, userId: result.userId!, email: result.email });
      spin.succeed(`Signed in as ${chalk.bold(result.email ?? '')}`);
      break;
    }

    console.log();
    nextSteps([
      ['kairos switch', 'pick a project & environment'],
      ['kairos secrets', 'view decrypted secrets'],
      ['kairos run -- <cmd>', 'run a command with secrets injected'],
    ]);
    console.log();
    ok(chalk.dim('Tip: manage devices and secrets at ') + chalk.cyan(WEB_URL));
    console.log();
  }
}
