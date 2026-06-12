import { Flags, Args } from '@oclif/core';
import { resolve } from 'path';
import chalk from 'chalk';
import { BaseCommand } from '../../lib/base-command';
import { api, API_BASE } from '../../lib/api';
import { loadPrivateKey } from '../../lib/keystore';
import { loadConfig, loadAuth } from '../../lib/config';
import {
  selfUnwrapDEK,
  unwrapDEKFromDevice,
  unwrapDEKWithToken,
  base64ToBytes,
  decryptSecret,
} from '../../lib/crypto';
import { header, divider, ok, hint, spinner, CliError, sym } from '../../lib/ui';

interface SecretEntry {
  key: string;
  encryptedValue: string;
  iv: string;
}

export default class SecretsList extends BaseCommand {
  static description = 'Decrypt and display secrets for the active environment';
  static flags = {
    generate: Flags.boolean({ char: 'g', description: 'Write secrets to file instead of printing' }),
    token: Flags.string({ char: 't', description: 'Deploy token (or set KAIROS_TOKEN env var)', env: 'KAIROS_TOKEN' }),
  };
  static args = {
    outfile: Args.string({ required: false, description: 'Output filename (used with -g, defaults to .env)' }),
  };

  async run() {
    const { flags, args } = await this.parse(SecretsList);

    let dek: Uint8Array;
    let secrets: SecretEntry[];
    let contextLabel = '';

    if (flags.token) {
      const spin = spinner('Fetching with deploy token…');
      const res = await fetch(`${API_BASE}/api/deploy-tokens/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: flags.token }),
      }).catch(() => null);
      if (!res || !res.ok) {
        spin.stop();
        throw new CliError('Invalid or expired deploy token.');
      }
      const payload = (await res.json()) as { tokenWrappedDEK: string; secrets: SecretEntry[] };
      try {
        dek = unwrapDEKWithToken(payload.tokenWrappedDEK, base64ToBytes(flags.token));
      } catch {
        spin.stop();
        throw new CliError('Deploy token could not decrypt this environment.');
      }
      secrets = payload.secrets;
      spin.stop();
      contextLabel = 'deploy token';
    } else {
      const auth = loadAuth();
      if (!auth) throw new CliError('Not logged in.', 'kairos login');
      const config = loadConfig();
      if (!config.defaultEnvironmentId) throw new CliError('No environment selected.', 'kairos switch');
      if (!config.deviceId) throw new CliError('This machine is not linked to any environment.', 'kairos switch');

      const privateKey = loadPrivateKey();
      if (!privateKey) throw new CliError('No device key found on this machine.', 'kairos switch');

      const spin = spinner('Syncing encrypted secrets…');
      let syncResult: { wrappedDEK: string; wrappedByPublicKey: string | null; secrets: SecretEntry[] };
      try {
        syncResult = await api.get(`/sync/${config.defaultEnvironmentId}?deviceId=${config.deviceId}`);
      } catch (e) {
        spin.stop();
        throw e;
      }

      spin.update('Decrypting locally…');
      try {
        dek = syncResult.wrappedByPublicKey
          ? unwrapDEKFromDevice(privateKey, base64ToBytes(syncResult.wrappedByPublicKey), syncResult.wrappedDEK)
          : selfUnwrapDEK(privateKey, syncResult.wrappedDEK);
      } catch {
        spin.stop();
        throw new CliError(
          'Could not decrypt — your device key may have changed or access was revoked.',
          'kairos switch',
        );
      }
      secrets = syncResult.secrets;
      spin.stop();
      contextLabel =
        (config.defaultProjectName ? `${config.defaultProjectName} ${sym.sep} ` : '') + (config.defaultEnvName ?? '');
    }

    if (flags.generate) {
      const { writeFileSync } = await import('fs');
      const outfile = args.outfile ? resolve(args.outfile) : resolve(process.cwd(), '.env');
      if (!secrets.length) {
        console.log();
        console.log(chalk.dim('  No secrets to write.'));
        console.log();
        return;
      }
      const lines = secrets.map((s) => `${s.key}=${decryptSecret(dek, s.encryptedValue, s.iv)}`);
      writeFileSync(outfile, lines.join('\n') + '\n');
      console.log();
      ok(`Wrote ${chalk.bold(secrets.length)} secret${secrets.length !== 1 ? 's' : ''} ${sym.arrow} ${chalk.cyan(outfile)}`);
      hint('Keep this file out of version control.');
      console.log();
      return;
    }

    header();

    if (!secrets.length) {
      console.log(chalk.dim('  No secrets in this environment yet. Add some in the web dashboard.'));
      console.log();
      return;
    }

    const decrypted = secrets.map((s) => ({ key: s.key, value: decryptSecret(dek, s.encryptedValue, s.iv) }));
    const keyWidth = Math.max(...decrypted.map((s) => s.key.length), 3) + 2;

    divider();
    console.log('  ' + chalk.dim('KEY'.padEnd(keyWidth)) + chalk.dim('VALUE'));
    divider();
    for (const s of decrypted) {
      console.log('  ' + chalk.cyan(s.key.padEnd(keyWidth)) + chalk.white(s.value));
    }
    divider();
    console.log(
      '  ' +
        chalk.dim(
          `${decrypted.length} secret${decrypted.length !== 1 ? 's' : ''} ${sym.bullet} decrypted locally ${sym.bullet} ${contextLabel}`,
        ),
    );
    console.log();
  }
}
