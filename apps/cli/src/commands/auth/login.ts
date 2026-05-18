import { Command } from '@oclif/core';
import { createInterface } from 'readline';
import { api } from '../../lib/api';
import { saveAuth, saveConfig } from '../../lib/config';
import { header, ok } from '../../lib/ui';

const API_URL = 'https://api.kairos.your-domain.com';

function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      process.stdout.write(question);
      process.stdin.setRawMode?.(true);
      let answer = '';
      process.stdin.on('data', function handler(char) {
        const c = char.toString();
        if (c === '\r' || c === '\n') {
          process.stdin.setRawMode?.(false);
          process.stdin.removeListener('data', handler);
          process.stdout.write('\n');
          rl.close();
          resolve(answer);
        } else if (c === '') {
          process.exit();
        } else {
          answer += c;
        }
      });
      process.stdin.resume();
    } else {
      rl.question(question, (answer) => { rl.close(); resolve(answer); });
    }
  });
}

export default class AuthLogin extends Command {
  static description = 'Log in to Kairos';

  async run() {
    saveConfig({ apiUrl: API_URL });

    const email = await prompt('  Email: ');
    const pass = await prompt('  Password: ', true);

    try {
      const result = await api.post<{ accessToken: string; userId: string }>('/auth/login', { email, password: pass });
      saveAuth({ accessToken: result.accessToken, userId: result.userId, email });
      header();
      ok(`Logged in as ${email}`);
      console.log();
    } catch (e: any) {
      this.error(`Login failed: ${e.message}`);
    }
  }
}
