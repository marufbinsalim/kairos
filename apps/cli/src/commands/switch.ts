import inquirer from 'inquirer';
import chalk from 'chalk';
import { randomBytes } from 'crypto';
import { BaseCommand } from '../lib/base-command';
import { api } from '../lib/api';
import { loadPrivateKey, savePrivateKey } from '../lib/keystore';
import { loadConfig, saveConfig, loadAuth } from '../lib/config';
import {
  generateKeypair,
  publicKeyFromPrivate,
  selfUnwrapDEK,
  unwrapDEKFromDevice,
  base64ToBytes,
  bytesToBase64,
} from '../lib/crypto';
import { info, spinner, nextSteps, CliError, sym } from '../lib/ui';

function randomDeviceName(): string {
  return 'dev-' + randomBytes(3).toString('hex');
}

interface EnvChoice {
  id: string;
  name: string;
  projectName?: string;
}

export default class Switch extends BaseCommand {
  static description = 'Switch the active project / environment';

  async run() {
    const auth = loadAuth();
    if (!auth) throw new CliError('Not logged in.', 'kairos login');

    // Ensure a device keypair exists
    let privateKey = loadPrivateKey();
    if (!privateKey) {
      const kp = generateKeypair();
      privateKey = kp.privateKey;
      savePrivateKey(privateKey);
    }
    const publicKey = publicKeyFromPrivate(privateKey);

    const config = loadConfig();

    console.log();
    let spin = spinner('Loading environments…');

    let allEnvs: EnvChoice[];
    try {
      allEnvs = await api.get<EnvChoice[]>('/environments');
    } catch (e) {
      spin.stop();
      throw e;
    }

    if (!allEnvs.length) {
      spin.stop();
      throw new CliError('No environments yet. Create a project and environment in the web dashboard first.');
    }

    // Which environments do our registered devices already cover?
    const registeredEnvIds = new Set<string>();
    const envDeviceMap = new Map<string, string>(); // envId → deviceId holding its DEK
    const allDeviceIds = config.deviceIds ?? (config.deviceId ? [config.deviceId] : []);
    await Promise.all(
      allDeviceIds.map(async (did) => {
        try {
          const deviceEnvs = await api.get<Array<{ id: string }>>(`/devices/${did}/environments`);
          for (const e of deviceEnvs) {
            registeredEnvIds.add(e.id);
            envDeviceMap.set(e.id, did);
          }
        } catch {
          /* device revoked or pending — skip */
        }
      }),
    );

    spin.stop();

    // Group environments by project for a scannable picker
    const byProject = new Map<string, EnvChoice[]>();
    for (const e of allEnvs) {
      const key = e.projectName ?? 'Unknown project';
      if (!byProject.has(key)) byProject.set(key, []);
      byProject.get(key)!.push(e);
    }

    const choices: Array<inquirer.Separator | { name: string; value: string; short: string }> = [];
    for (const [projectName, envs] of byProject) {
      choices.push(new inquirer.Separator(chalk.bold.white('  ' + projectName)));
      for (const e of envs) {
        const isActive = e.id === config.defaultEnvironmentId;
        const registered = registeredEnvIds.has(e.id);
        choices.push({
          name:
            chalk.cyan(e.name) +
            (isActive ? chalk.green(' (active)') : '') +
            '  ' +
            (registered ? chalk.green(`${sym.on} linked`) : chalk.dim(`${sym.off} not linked`)),
          value: e.id,
          short: `${projectName} ${sym.sep} ${e.name}`,
        });
      }
    }

    const { envId } = await inquirer.prompt<{ envId: string }>([
      {
        type: 'list',
        name: 'envId',
        message: 'Select environment',
        prefix: ' ' + chalk.cyan(sym.pointer),
        pageSize: 14,
        choices,
      },
    ]);

    const selectedEnv = allEnvs.find((e) => e.id === envId)!;
    const envLabel = (selectedEnv.projectName ? chalk.bold(selectedEnv.projectName) + chalk.dim(` ${sym.sep} `) : '') + chalk.bold.green(selectedEnv.name);
    let deviceId = envDeviceMap.get(envId) ?? config.deviceId;

    if (!registeredEnvIds.has(envId)) {
      console.log();
      const deviceName = config.deviceName ?? randomDeviceName();
      if (!config.deviceName) saveConfig({ deviceName });

      spin = spinner(`Requesting access to ${selectedEnv.name}…`);
      const result = await api.post<{ deviceId: string; status: string }>('/devices/register', {
        publicKey: bytesToBase64(publicKey),
        type: 'cli',
        label: `CLI on ${process.platform} - "${deviceName}"`,
        environmentIds: [envId],
      });
      spin.succeed(`Access requested for ${envLabel}`);

      deviceId = result.deviceId;
      const existingIds = config.deviceIds ?? (config.deviceId ? [config.deviceId] : []);
      saveConfig({
        deviceId,
        deviceIds: existingIds.includes(result.deviceId) ? existingIds : [...existingIds, result.deviceId],
        deviceEnvMap: { ...(config.deviceEnvMap ?? {}), [envId]: result.deviceId },
      });

      if (result.status !== 'active') {
        info(`Approve this device in the web dashboard ${chalk.cyan(`${sym.arrow} Devices`)}`);
        console.log('  ' + chalk.dim(`Press Ctrl+C to cancel — the request stays pending and you can approve it later.`));
        console.log();

        spin = spinner('Waiting for approval…');
        const startedAt = Date.now();
        let approved = false;
        while (!approved) {
          await new Promise((r) => setTimeout(r, 3500));
          const elapsed = Math.round((Date.now() - startedAt) / 1000);
          spin.update(`Waiting for approval… ${chalk.dim(`${elapsed}s`)}`);
          try {
            const [activeDevices, pendingDevices] = await Promise.all([
              api.get<Array<{ id: string }>>('/devices'),
              api.get<Array<{ id: string }>>('/devices/pending').catch(() => [] as Array<{ id: string }>),
            ]);
            if (activeDevices.some((d) => d.id === deviceId)) {
              approved = true;
            } else if (!pendingDevices.some((d) => d.id === deviceId)) {
              spin.fail('The access request was declined or removed in the dashboard.');
              throw new CliError('Device was not approved.', 'kairos switch');
            }
          } catch (e) {
            if (e instanceof CliError) throw e;
            /* transient network error — keep polling */
          }
        }
        spin.succeed(chalk.bold('Device approved'));
      }
    }

    // Verify we can actually decrypt this environment with our key
    spin = spinner('Verifying encrypted access…');
    let syncResult: { wrappedDEK: string; wrappedByPublicKey: string | null; secrets: Array<unknown> };
    try {
      syncResult = await api.get(`/sync/${envId}?deviceId=${deviceId}`);
    } catch (e) {
      spin.stop();
      throw e;
    }

    try {
      syncResult.wrappedByPublicKey
        ? unwrapDEKFromDevice(privateKey!, base64ToBytes(syncResult.wrappedByPublicKey), syncResult.wrappedDEK)
        : selfUnwrapDEK(privateKey!, syncResult.wrappedDEK);
    } catch {
      spin.stop();
      throw new CliError(
        'Could not decrypt the environment key — your device key may have changed since approval.',
        'kairos switch',
      );
    }

    saveConfig({
      defaultEnvironmentId: envId,
      defaultEnvName: selectedEnv.name,
      defaultProjectName: selectedEnv.projectName ?? '',
    });

    const count = syncResult.secrets.length;
    spin.succeed(`Switched to ${envLabel} ${chalk.dim(`${sym.bullet} ${count} secret${count !== 1 ? 's' : ''} available`)}`);
    console.log();
    nextSteps([
      ['kairos secrets', 'view decrypted secrets'],
      ['kairos secrets -g', 'write secrets to .env'],
      ['kairos run -- <cmd>', 'run a command with secrets injected'],
    ]);
    console.log();
  }
}
