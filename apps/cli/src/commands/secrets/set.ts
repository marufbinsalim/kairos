import { Command, Flags, Args } from '@oclif/core';
import { api } from '../../lib/api';
import { loadPrivateKey } from '../../lib/keystore';
import { loadConfig, loadAuth } from '../../lib/config';
import { selfUnwrapDEK, unwrapDEKFromDevice, base64ToBytes, encryptSecret } from '../../lib/crypto';
import { header, ok } from '../../lib/ui';
import chalk from 'chalk';

export default class SecretsSet extends Command {
  static description = 'Set a secret (KEY=VALUE)';
  static args = { assignment: Args.string({ required: true, description: 'KEY=VALUE' }) };
  static flags = { env: Flags.string({ char: 'e', description: 'Environment ID' }) };

  async run() {
    const { args, flags } = await this.parse(SecretsSet);
    const auth = loadAuth();
    if (!auth) this.error('Not logged in.');
    const config = loadConfig();
    const envId = flags.env ?? config.defaultEnvironmentId;
    if (!envId) this.error('No environment selected. Run: kairos sync');
    if (!config.deviceId) this.error('No device registered.');

    const eqIdx = args.assignment.indexOf('=');
    if (eqIdx === -1) this.error('Format must be KEY=VALUE');
    const key = args.assignment.slice(0, eqIdx);
    const value = args.assignment.slice(eqIdx + 1);

    const privateKey = loadPrivateKey();
    if (!privateKey) this.error('No private key found.');

    const syncResult = await api.get<{
      wrappedDEK: string;
      wrappedByPublicKey: string | null;
      secrets: unknown[];
    }>(`/sync/${envId}?deviceId=${config.deviceId}`);

    const dek = syncResult.wrappedByPublicKey
      ? unwrapDEKFromDevice(privateKey, base64ToBytes(syncResult.wrappedByPublicKey), syncResult.wrappedDEK)
      : selfUnwrapDEK(privateKey, syncResult.wrappedDEK);

    const { encryptedValue, iv } = encryptSecret(dek, value);
    await api.post(`/environments/${envId}/secrets`, { key, encryptedValue, iv });

    header();
    ok(`${chalk.cyan(key)} set`);
    console.log();
  }
}
