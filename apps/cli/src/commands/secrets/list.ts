import { Flags, Args } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command';
import { resolve } from 'path';
import { api } from '../../lib/api';
import { loadPrivateKey } from '../../lib/keystore';
import { loadConfig, loadAuth } from '../../lib/config';
import { selfUnwrapDEK, unwrapDEKFromDevice, base64ToBytes, decryptSecret } from '../../lib/crypto';
import { header, divider, ok } from '../../lib/ui';
import chalk from 'chalk';

export default class SecretsList extends BaseCommand {
  static description = 'Decrypt and display secrets for active environment';
  static flags = {
    generate: Flags.boolean({ char: 'g', description: 'Write secrets to file instead of printing' }),
  };
  static args = {
    outfile: Args.string({ required: false, description: 'Output filename (used with -g, defaults to .env)' }),
  };

  async run() {
    const { flags, args } = await this.parse(SecretsList);
    const auth = loadAuth();
    if (!auth) this.error('Not logged in. Run: kairos login');
    const config = loadConfig();
    if (!config.defaultEnvironmentId) this.error('No environment selected. Run: kairos switch');
    if (!config.deviceId) this.error('No device registered. Run: kairos switch');

    const privateKey = loadPrivateKey();
    if (!privateKey) this.error('No private key found. Run: kairos switch');

    const syncResult = await api.get<{
      wrappedDEK: string;
      wrappedByPublicKey: string | null;
      secrets: Array<{ key: string; encryptedValue: string; iv: string }>;
    }>(`/sync/${config.defaultEnvironmentId}?deviceId=${config.deviceId}`);

    const dek = syncResult.wrappedByPublicKey
      ? unwrapDEKFromDevice(privateKey, base64ToBytes(syncResult.wrappedByPublicKey), syncResult.wrappedDEK)
      : selfUnwrapDEK(privateKey, syncResult.wrappedDEK);

    if (flags.generate) {
      const { writeFileSync } = await import('fs');
      const outfile = args.outfile ? resolve(args.outfile) : resolve(process.cwd(), '.env');
      if (!syncResult.secrets.length) {
        console.log(chalk.dim('  No secrets to write.\n'));
        return;
      }
      const lines = syncResult.secrets.map((s) => `${s.key}=${decryptSecret(dek, s.encryptedValue, s.iv)}`);
      writeFileSync(outfile, lines.join('\n') + '\n');
      console.log();
      ok(`Written → ${chalk.cyan(outfile)}  ${chalk.dim(`(${syncResult.secrets.length} secrets)`)}`);
      console.log();
      return;
    }

    header();

    if (!syncResult.secrets.length) {
      console.log(chalk.dim('  No secrets in this environment.\n'));
      return;
    }

    const maxKeyLen = Math.max(...syncResult.secrets.map((s) => s.key.length), 8);
    divider();
    console.log('  ' + chalk.bold.white('KEY'.padEnd(maxKeyLen + 2)) + chalk.bold.white('VALUE'));
    divider();

    for (const s of syncResult.secrets) {
      const value = decryptSecret(dek, s.encryptedValue, s.iv);
      console.log('  ' + chalk.cyan(s.key.padEnd(maxKeyLen + 2)) + chalk.white(value));
    }

    divider();
    console.log(chalk.dim(`  ${syncResult.secrets.length} secret${syncResult.secrets.length !== 1 ? 's' : ''}\n`));
  }
}
