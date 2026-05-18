import { Command, Flags } from '@oclif/core';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { api } from '../lib/api';
import { loadPrivateKey } from '../lib/keystore';
import { loadConfig, saveConfig, loadAuth } from '../lib/config';
import { selfUnwrapDEK, unwrapDEKFromDevice, base64ToBytes, decryptSecret } from '../lib/crypto';
import { selectProjectAndEnv } from '../lib/prompts';
import { header, ok, info } from '../lib/ui';
import chalk from 'chalk';

export default class Sync extends Command {
  static description = 'Sync secrets for an environment';
  static flags = {
    env: Flags.string({ char: 'e', description: 'Environment ID (skips interactive selector)' }),
    generate: Flags.boolean({ char: 'g', description: 'Write secrets to .env in current directory' }),
  };

  async run() {
    const { flags } = await this.parse(Sync);
    const auth = loadAuth();
    if (!auth) this.error('Not logged in. Run: kairos auth login');
    const config = loadConfig();
    if (!config.deviceId) this.error('No device registered. Run: kairos devices register');

    const privateKey = loadPrivateKey();
    if (!privateKey) this.error('No private key found. Run: kairos devices register');

    let envId: string;
    let envName: string | undefined;

    if (flags.env) {
      envId = flags.env;
    } else {
      // Interactive project → env selection
      console.log();
      const selected = await selectProjectAndEnv();
      envId = selected.envId;
      envName = selected.envName;
    }

    const result = await api.get<{
      wrappedDEK: string;
      wrappedByPublicKey: string | null;
      secrets: Array<{ key: string; encryptedValue: string; iv: string }>;
    }>(`/sync/${envId}?deviceId=${config.deviceId}`);

    const dek = result.wrappedByPublicKey
      ? unwrapDEKFromDevice(privateKey, base64ToBytes(result.wrappedByPublicKey), result.wrappedDEK)
      : selfUnwrapDEK(privateKey, result.wrappedDEK);

    saveConfig({ defaultEnvironmentId: envId, ...(envName ? { defaultEnvName: envName } : {}) });

    header();
    ok(`Synced ${chalk.bold(result.secrets.length)} secret${result.secrets.length !== 1 ? 's' : ''}`);

    if (flags.generate) {
      const lines = result.secrets.map((s) => {
        const value = decryptSecret(dek, s.encryptedValue, s.iv);
        return `${s.key}=${value}`;
      });
      const envPath = join(process.cwd(), '.env');
      writeFileSync(envPath, lines.join('\n') + '\n');
      ok(`.env written to ${chalk.cyan(envPath)}`);
    } else {
      info(`Run ${chalk.cyan('kairos secrets list')} to decrypt, or use ${chalk.cyan('-g')} to generate .env`);
    }

    console.log();
  }
}
