import { Command } from '@oclif/core';
import inquirer from 'inquirer';
import { randomBytes } from 'crypto';
import { api } from '../lib/api';
import { loadPrivateKey, savePrivateKey } from '../lib/keystore';
import { loadConfig, saveConfig, loadAuth } from '../lib/config';
import { generateKeypair, publicKeyFromPrivate, selfUnwrapDEK, unwrapDEKFromDevice, base64ToBytes, bytesToBase64 } from '../lib/crypto';
import { header, ok, info, err, dot } from '../lib/ui';

function randomDeviceName(): string {
  return 'dev-' + randomBytes(3).toString('hex');
}
import chalk from 'chalk';

export default class Switch extends Command {
  static description = 'Switch active project / environment';

  async run() {
    const auth = loadAuth();
    if (!auth) this.error('Not logged in. Run: kairos login');

    // Ensure keypair exists
    let privateKey = loadPrivateKey();
    if (!privateKey) {
      const kp = generateKeypair();
      privateKey = kp.privateKey;
      savePrivateKey(privateKey);
    }
    const publicKey = publicKeyFromPrivate(privateKey);

    const config = loadConfig();

    // Fetch all environments flat
    let allEnvs: Array<{ id: string; name: string; projectName?: string }>;
    try {
      allEnvs = await api.get('/environments');
    } catch (e: any) {
      this.error(`Failed to fetch environments: ${e.message}`);
    }
    if (!allEnvs.length) this.error('No environments found. Create one in the web UI first.');

    // Find which envs all registered devices cover, tracking which device handles each env
    const registeredEnvIds = new Set<string>();
    const envDeviceMap = new Map<string, string>(); // envId → deviceId that holds its DEK
    const allDeviceIds = config.deviceIds ?? (config.deviceId ? [config.deviceId] : []);
    for (const did of allDeviceIds) {
      try {
        const deviceEnvs = await api.get<Array<{ id: string }>>(`/devices/${did}/environments`);
        for (const e of deviceEnvs) {
          registeredEnvIds.add(e.id);
          envDeviceMap.set(e.id, did);
        }
      } catch { /* device revoked or not active — skip */ }
    }

    console.log();
    const { envId } = await inquirer.prompt<{ envId: string }>([{
      type: 'list',
      name: 'envId',
      message: 'Select environment:',
      choices: allEnvs.map((e) => ({
        name: (
          (e.projectName ? chalk.bold(e.projectName) + chalk.dim(' › ') : '') +
          chalk.cyan(e.name) +
          '  ' +
          (registeredEnvIds.has(e.id) ? chalk.green('[registered]') : chalk.dim('[not registered]'))
        ),
        value: e.id,
      })),
    }]);

    const selectedEnv = allEnvs.find((e) => e.id === envId)!;
    let deviceId = envDeviceMap.get(envId) ?? config.deviceId;

    if (!registeredEnvIds.has(envId)) {
      // Submit a new registration request for this env
      console.log();
      info(`Submitting registration request for ${chalk.cyan(`${selectedEnv.projectName ?? ''} › ${selectedEnv.name}`)}…`);
      console.log();

      const deviceName = config.deviceName ?? randomDeviceName();
      if (!config.deviceName) saveConfig({ deviceName });

      const result = await api.post<{ deviceId: string; status: string }>('/devices/register', {
        publicKey: bytesToBase64(publicKey),
        type: 'cli',
        label: `CLI on ${process.platform} - "${deviceName}"`,
        environmentIds: [envId],
      });

      deviceId = result.deviceId;
      const existingIds = config.deviceIds ?? (config.deviceId ? [config.deviceId] : []);
      const updatedEnvMap = { ...(config.deviceEnvMap ?? {}), [envId]: result.deviceId };
      saveConfig({
        deviceId,
        deviceIds: existingIds.includes(result.deviceId) ? existingIds : [...existingIds, result.deviceId],
        deviceEnvMap: updatedEnvMap,
      });

      info(`Waiting for approval in the web UI ${chalk.cyan('→ /devices')}`);
      process.stdout.write('  ');

      let approved = false;
      while (!approved) {
        await new Promise((r) => setTimeout(r, 5000));
        try {
          const devices = await api.get<Array<{ id: string; status: string }>>('/devices');
          if (devices.find((d) => d.id === deviceId && d.status === 'active')) {
            approved = true;
          } else {
            dot();
          }
        } catch { /* keep polling */ }
      }

      console.log('\n');
      header();
      ok(chalk.bold('Device approved!'));
    }

    // Sync and verify
    let syncResult: { wrappedDEK: string; wrappedByPublicKey: string | null; secrets: Array<unknown> };
    try {
      syncResult = await api.get(`/sync/${envId}?deviceId=${deviceId}`);
    } catch (e: any) {
      err(`Sync failed: ${e.message}`);
      return;
    }

    try {
      syncResult.wrappedByPublicKey
        ? unwrapDEKFromDevice(privateKey!, base64ToBytes(syncResult.wrappedByPublicKey), syncResult.wrappedDEK)
        : selfUnwrapDEK(privateKey!, syncResult.wrappedDEK);
    } catch {
      err('Could not decrypt environment key — device may not be approved for this environment.');
      return;
    }

    saveConfig({
      defaultEnvironmentId: envId,
      defaultEnvName: selectedEnv.name,
      defaultProjectName: selectedEnv.projectName ?? '',
    });

    console.log();
    header();
    ok(`Switched to  ${chalk.bold(selectedEnv.projectName ?? '')} ${chalk.dim('›')} ${chalk.bold.green(selectedEnv.name)}`);
    ok(`${chalk.bold(syncResult.secrets.length)} secret${syncResult.secrets.length !== 1 ? 's' : ''} available`);
    info(`Run ${chalk.cyan('kairos secrets')} to decrypt`);
    console.log();
  }
}
