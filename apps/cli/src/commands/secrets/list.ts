import { Command, Flags } from '@oclif/core';
import { api } from '../../lib/api';
import { loadPrivateKey } from '../../lib/keystore';
import { loadConfig, loadAuth } from '../../lib/config';
import { selfUnwrapDEK, unwrapDEKFromDevice, base64ToBytes, decryptSecret } from '../../lib/crypto';
import { header, divider } from '../../lib/ui';
import chalk from 'chalk';

export default class SecretsList extends Command {
  static description = 'List and decrypt all secrets';
  static flags = {
    env: Flags.string({ char: 'e', description: 'Environment ID' }),
    generate: Flags.boolean({ char: 'g', description: 'Write secrets to .env in current directory' }),
  };

  async run() {
    const { flags } = await this.parse(SecretsList);
    const auth = loadAuth();
    if (!auth) this.error('Not logged in.');
    const config = loadConfig();
    const envId = flags.env ?? config.defaultEnvironmentId;
    if (!envId) this.error('No environment selected. Run: kairos switch');
    if (!config.deviceId) this.error('No device registered.');

    const privateKey = loadPrivateKey();
    if (!privateKey) this.error('No private key found.');

    const syncResult = await api.get<{
      wrappedDEK: string;
      wrappedByPublicKey: string | null;
      secrets: Array<{ key: string; encryptedValue: string; iv: string }>;
    }>(`/sync/${envId}?deviceId=${config.deviceId}`);

    const dek = syncResult.wrappedByPublicKey
      ? unwrapDEKFromDevice(privateKey, base64ToBytes(syncResult.wrappedByPublicKey), syncResult.wrappedDEK)
      : selfUnwrapDEK(privateKey, syncResult.wrappedDEK);

    header();

    if (flags.generate) {
      const { writeFileSync } = await import('fs');
      const { join } = await import('path');
      if (!syncResult.secrets.length) {
        console.log(chalk.dim('  No secrets to write.\n'));
        return;
      }
      const lines = syncResult.secrets.map((s) => `${s.key}=${decryptSecret(dek, s.encryptedValue, s.iv)}`);
      const envPath = join(process.cwd(), '.env');
      writeFileSync(envPath, lines.join('\n') + '\n');
      const { ok } = await import('../../lib/ui');
      ok(`.env written → ${chalk.cyan(envPath)}  ${chalk.dim(`(${syncResult.secrets.length} secrets)`)}`);
      console.log();
      return;
    }

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
