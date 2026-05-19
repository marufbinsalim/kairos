import { Command } from '@oclif/core';
import { createInterface } from 'readline';
import { api } from '../lib/api';
import { saveAuth, saveConfig } from '../lib/config';
import { header, ok } from '../lib/ui';

const API_URL = 'https://concave-pronto-earthlike.ngrok-free.dev';

function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    if (hidden && process.stdin.setRawMode) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      process.stdout.write(question);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      let answer = '';
      process.stdin.on('data', function handler(char) {
        const c = char.toString();
        if (c === '\r' || c === '\n') {
          process.stdin.setRawMode!(false);
          process.stdin.removeListener('data', handler);
          process.stdout.write('\n');
          rl.close();
          resolve(answer);
        } else if (c === '') {
          process.exit();
        } else if (c === '\x7f') {
          answer = answer.slice(0, -1);
        } else {
          answer += c;
        }
      });
    } else {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      rl.question(question, (answer) => { rl.close(); resolve(answer); });
    }
  });
}

export default class Login extends Command {
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
