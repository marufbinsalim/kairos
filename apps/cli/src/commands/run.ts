import { Flags, Args } from '@oclif/core';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { BaseCommand } from '../lib/base-command';
import { api, API_BASE } from '../lib/api';
import { loadPrivateKey } from '../lib/keystore';
import { loadConfig, loadAuth } from '../lib/config';
import {
  selfUnwrapDEK,
  unwrapDEKFromDevice,
  unwrapDEKWithToken,
  base64ToBytes,
  decryptSecret,
} from '../lib/crypto';
import { CliError, sym } from '../lib/ui';

interface SecretEntry {
  key: string;
  encryptedValue: string;
  iv: string;
}

export default class Run extends BaseCommand {
  static description = 'Inject secrets as env vars and run a command';
  static strict = false;
  static flags = {
    token: Flags.string({ char: 't', description: 'Deploy token (or set KAIROS_TOKEN env var)', env: 'KAIROS_TOKEN' }),
  };
  static args = {
    command: Args.string({ required: true, description: 'Command to run' }),
  };
  static examples = ['kairos run -- npm start', 'kairos run -t <token> -- node server.js'];

  async run() {
    const { flags, argv } = await this.parse(Run);

    const sepIdx = argv.indexOf('--');
    const cmdArgs = sepIdx >= 0 ? argv.slice(sepIdx + 1) : (argv as string[]).filter((a) => !a.startsWith('-'));
    if (!cmdArgs.length) throw new CliError('Specify a command after --, e.g. kairos run -- npm start');

    let dek: Uint8Array;
    let secrets: SecretEntry[];
    let contextLabel = '';

    if (flags.token) {
      const res = await fetch(`${API_BASE}/api/deploy-tokens/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: flags.token }),
      }).catch(() => null);
      if (!res || !res.ok) throw new CliError('Invalid or expired deploy token.');
      const payload = (await res.json()) as { tokenWrappedDEK: string; secrets: SecretEntry[] };
      try {
        dek = unwrapDEKWithToken(payload.tokenWrappedDEK, base64ToBytes(flags.token));
      } catch {
        throw new CliError('Deploy token could not decrypt this environment.');
      }
      secrets = payload.secrets;
      contextLabel = 'deploy token';
    } else {
      const auth = loadAuth();
      if (!auth) throw new CliError('Not logged in.', 'kairos login');
      const config = loadConfig();
      if (!config.defaultEnvironmentId) throw new CliError('No environment selected.', 'kairos switch');
      if (!config.deviceId) throw new CliError('This machine is not linked to any environment.', 'kairos switch');

      const privateKey = loadPrivateKey();
      if (!privateKey) throw new CliError('No device key found on this machine.', 'kairos switch');

      const syncResult = await api.get<{
        wrappedDEK: string;
        wrappedByPublicKey: string | null;
        secrets: SecretEntry[];
      }>(`/sync/${config.defaultEnvironmentId}?deviceId=${config.deviceId}`);

      try {
        dek = syncResult.wrappedByPublicKey
          ? unwrapDEKFromDevice(privateKey, base64ToBytes(syncResult.wrappedByPublicKey), syncResult.wrappedDEK)
          : selfUnwrapDEK(privateKey, syncResult.wrappedDEK);
      } catch {
        throw new CliError(
          'Could not decrypt — your device key may have changed or access was revoked.',
          'kairos switch',
        );
      }
      secrets = syncResult.secrets;
      contextLabel =
        (config.defaultProjectName ? `${config.defaultProjectName} ${sym.sep} ` : '') + (config.defaultEnvName ?? '');
    }

    const env: Record<string, string> = { ...(process.env as Record<string, string>) };
    for (const s of secrets) {
      env[s.key] = decryptSecret(dek, s.encryptedValue, s.iv);
    }

    const [cmd, ...args] = cmdArgs as string[];
    // Status goes to stderr — stdout belongs to the child process
    process.stderr.write(
      chalk.dim(
        `  ${sym.pointer} kairos ${sym.bullet} injected ${secrets.length} secret${secrets.length !== 1 ? 's' : ''} ${sym.bullet} ${contextLabel} ${sym.bullet} ${cmd} ${args.join(' ')}\n`,
      ),
    );
    const child = spawn(cmd, args, { env, stdio: 'inherit', shell: false });
    child.on('error', (e: NodeJS.ErrnoException) => {
      process.stderr.write(
        '  ' + chalk.red(sym.err) + ' ' + (e.code === 'ENOENT' ? `Command not found: ${cmd}` : e.message) + '\n',
      );
      process.exit(127);
    });
    child.on('exit', (code) => process.exit(code ?? 0));
  }
}
