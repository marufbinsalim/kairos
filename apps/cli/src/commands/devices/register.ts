import { Command } from '@oclif/core';
import { generateKeypair, bytesToBase64, publicKeyFromPrivate, selfUnwrapDEK, unwrapDEKFromDevice, base64ToBytes } from '../../lib/crypto';
import { savePrivateKey, loadPrivateKey } from '../../lib/keystore';
import { saveConfig, loadAuth } from '../../lib/config';
import { api } from '../../lib/api';
import { selectEnvironmentsForRegistration } from '../../lib/prompts';
import { header, ok, info, warn, dot } from '../../lib/ui';
import chalk from 'chalk';

export default class DevicesRegister extends Command {
  static description = 'Register this device and request environment access';

  async run() {
    const auth = loadAuth();
    if (!auth) this.error('Not logged in. Run: kairos auth login');

    let privateKey = loadPrivateKey();
    let publicKey: Uint8Array;

    console.log();
    if (!privateKey) {
      const keypair = generateKeypair();
      privateKey = keypair.privateKey;
      publicKey = keypair.publicKey;
      savePrivateKey(privateKey);
      ok('Generated new keypair');
    } else {
      publicKey = publicKeyFromPrivate(privateKey);
      ok('Using existing keypair');
    }

    console.log();
    info('Select the environments this device should have access to:');
    console.log();

    let selectedEnvs: Array<{ id: string; name: string; projectName: string }>;
    try {
      selectedEnvs = await selectEnvironmentsForRegistration();
    } catch (e: any) {
      warn(e.message);
      warn('Register a device after creating environments in the web UI.');
      return;
    }

    console.log();
    const result = await api.post<{ deviceId: string; status: string }>('/devices/register', {
      publicKey: bytesToBase64(publicKey),
      type: 'cli',
      label: `CLI on ${process.platform}`,
      environmentIds: selectedEnvs.map((e) => e.id),
    });

    saveConfig({ deviceId: result.deviceId });
    ok(`Device registered ${chalk.dim(result.deviceId.slice(0, 8) + '…')}`);
    console.log();

    info(`Requested access to ${chalk.bold(selectedEnvs.length)} environment${selectedEnvs.length !== 1 ? 's' : ''}:`);
    for (const env of selectedEnvs) {
      console.log(`  ${chalk.dim('›')} ${chalk.green(env.projectName)} ${chalk.dim('/')} ${chalk.cyan(env.name)}`);
    }
    console.log();

    info(`Waiting for approval in the web UI ${chalk.cyan('→ /devices')} `);
    process.stdout.write('  ');

    let approved = false;
    while (!approved) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const devices = await api.get<Array<{ id: string; status: string }>>('/devices');
        const me = devices.find((d) => d.id === result.deviceId);
        if (me?.status === 'active') {
          approved = true;
        } else {
          dot();
        }
      } catch {
        // keep polling
      }
    }

    console.log('\n');
    header();
    ok(chalk.bold('Device approved!'));
    console.log();

    // Sync the first approved environment
    try {
      const firstEnv = selectedEnvs[0];
      const syncResult = await api.get<{
        wrappedDEK: string;
        wrappedByPublicKey: string | null;
        secrets: Array<{ key: string; encryptedValue: string; iv: string }>;
      }>(`/sync/${firstEnv.id}?deviceId=${result.deviceId}`);

      if (syncResult.wrappedDEK) {
        syncResult.wrappedByPublicKey
          ? await unwrapDEKFromDevice(privateKey!, base64ToBytes(syncResult.wrappedByPublicKey), syncResult.wrappedDEK)
          : await selfUnwrapDEK(privateKey!, syncResult.wrappedDEK);
      }

      saveConfig({
        defaultProjectId: '',
        defaultProjectName: firstEnv.projectName,
        defaultEnvironmentId: firstEnv.id,
        defaultEnvName: firstEnv.name,
      });

      ok(`Synced ${chalk.bold(syncResult.secrets.length)} secrets for ${chalk.green(`${firstEnv.projectName} › ${firstEnv.name}`)}`);
      info(`Run ${chalk.cyan('kairos secrets list')} to decrypt`);
      console.log();
    } catch (e: any) {
      info(`Skipped initial sync: ${e.message}`);
      info(`Run ${chalk.cyan('kairos sync')} to select an environment`);
      console.log();
    }
  }
}
