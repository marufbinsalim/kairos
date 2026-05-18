import { Command } from '@oclif/core';
import { api } from '../lib/api';
import { loadPrivateKey } from '../lib/keystore';
import { loadConfig, saveConfig, loadAuth } from '../lib/config';
import { selfUnwrapDEK, unwrapDEKFromDevice, base64ToBytes } from '../lib/crypto';
import { selectProjectAndEnv } from '../lib/prompts';
import { header, ok, info, err } from '../lib/ui';
import chalk from 'chalk';

export default class Switch extends Command {
  static description = 'Switch active project environment';

  async run() {
    const auth = loadAuth();
    if (!auth) this.error('Not logged in. Run: kairos auth login');
    const config = loadConfig();
    if (!config.deviceId) this.error('No device registered. Run: kairos devices register');

    const privateKey = loadPrivateKey();
    if (!privateKey) this.error('No private key found. Run: kairos devices register');

    console.log();
    const { projectName, envId, envName } = await selectProjectAndEnv();

    const result = await api.get<{
      wrappedDEK: string;
      wrappedByPublicKey: string | null;
      secrets: Array<unknown>;
    }>(`/sync/${envId}?deviceId=${config.deviceId}`);

    // Verify we can actually unwrap — surfaces access errors early
    try {
      result.wrappedByPublicKey
        ? unwrapDEKFromDevice(privateKey, base64ToBytes(result.wrappedByPublicKey), result.wrappedDEK)
        : selfUnwrapDEK(privateKey, result.wrappedDEK);
    } catch {
      err('Could not decrypt environment key — device may not be approved for this environment.');
      return;
    }

    saveConfig({
      defaultEnvironmentId: envId,
      defaultEnvName: envName,
      defaultProjectName: projectName,
    });

    header();
    ok(`Switched to  ${chalk.bold(projectName)} ${chalk.dim('›')} ${chalk.bold.green(envName)}`);
    ok(`${chalk.bold(result.secrets.length)} secret${result.secrets.length !== 1 ? 's' : ''} available`);
    info(`Run ${chalk.cyan('kairos secrets list')} to decrypt, or ${chalk.cyan('kairos secrets list -g')} to write .env`);
    console.log();
  }
}
