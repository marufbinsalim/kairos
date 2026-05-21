import { Flags, Args } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command';
import { resolve } from 'path';
import { api } from '../../lib/api';
import { loadPrivateKey } from '../../lib/keystore';
import { loadConfig, loadAuth } from '../../lib/config';
import { selfUnwrapDEK, unwrapDEKFromDevice, unwrapDEKWithToken, base64ToBytes, decryptSecret } from '../../lib/crypto';
import { header, divider, ok } from '../../lib/ui';
import chalk from 'chalk';

export default class SecretsList extends BaseCommand {
  static description = 'Decrypt and display secrets for active environment';
  static flags = {
    generate: Flags.boolean({ char: 'g', description: 'Write secrets to file instead of printing' }),
    token: Flags.string({ char: 't', description: 'Deploy token (or set KAIROS_TOKEN env var)', env: 'KAIROS_TOKEN' }),
  };
  static args = {
    outfile: Args.string({ required: false, description: 'Output filename (used with -g, defaults to .env)' }),
  };

  async run() {
    const { flags, args } = await this.parse(SecretsList);

    const token = flags.token;
    let dek: Uint8Array;
    let secrets: Array<{ key: string; encryptedValue: string; iv: string }>;

    if (token) {
      const config = loadConfig();
      const result = await fetch(`https://kairoscli-api.onrender.com/api/deploy-tokens/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!result.ok) this.error('Invalid or expired deploy token');
      const payload = await result.json() as { tokenWrappedDEK: string; secrets: typeof secrets };
      dek = unwrapDEKWithToken(payload.tokenWrappedDEK, base64ToBytes(token));
      secrets = payload.secrets;
    } else {
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
        secrets: typeof secrets;
      }>(`/sync/${config.defaultEnvironmentId}?deviceId=${config.deviceId}`);

      dek = syncResult.wrappedByPublicKey
        ? unwrapDEKFromDevice(privateKey, base64ToBytes(syncResult.wrappedByPublicKey), syncResult.wrappedDEK)
        : selfUnwrapDEK(privateKey, syncResult.wrappedDEK);
      secrets = syncResult.secrets;
    }

    if (flags.generate) {
      const { writeFileSync } = await import('fs');
      const outfile = args.outfile ? resolve(args.outfile) : resolve(process.cwd(), '.env');
      if (!secrets.length) {
        console.log(chalk.dim('  No secrets to write.\n'));
        return;
      }
      const lines = secrets.map((s) => `${s.key}=${decryptSecret(dek, s.encryptedValue, s.iv)}`);
      writeFileSync(outfile, lines.join('\n') + '\n');
      console.log();
      ok(`Written → ${chalk.cyan(outfile)}  ${chalk.dim(`(${secrets.length} secrets)`)}`);
      console.log();
      return;
    }

    header();

    if (!secrets.length) {
      console.log(chalk.dim('  No secrets in this environment.\n'));
      return;
    }

    const maxKeyLen = Math.max(...secrets.map((s) => s.key.length), 8);
    divider();
    console.log('  ' + chalk.bold.white('KEY'.padEnd(maxKeyLen + 2)) + chalk.bold.white('VALUE'));
    divider();

    for (const s of secrets) {
      const value = decryptSecret(dek, s.encryptedValue, s.iv);
      console.log('  ' + chalk.cyan(s.key.padEnd(maxKeyLen + 2)) + chalk.white(value));
    }

    divider();
    console.log(chalk.dim(`  ${secrets.length} secret${secrets.length !== 1 ? 's' : ''}\n`));
  }
}
