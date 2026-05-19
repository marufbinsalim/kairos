import { Command } from '@oclif/core';
import { clearAuth } from '../lib/config';
import { ok } from '../lib/ui';

export default class Logout extends Command {
  static description = 'Log out from Kairos';

  async run() {
    clearAuth();
    console.log();
    ok('Logged out.');
    console.log();
  }
}
