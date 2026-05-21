import { Flags, Args } from '@oclif/core';
import { BaseCommand } from '../lib/base-command';
import { spawn } from 'child_process';
import { api } from '../lib/api';
import { loadPrivateKey } from '../lib/keystore';
import { loadConfig, loadAuth } from '../lib/config';
import { selfUnwrapDEK, unwrapDEKFromDevice, unwrapDEKWithToken, base64ToBytes, decryptSecret } from '../lib/crypto';

export default class Run extends BaseCommand {
  static description = 'Inject secrets as env vars and run a command';
  static strict = false;
  static flags = {
    token: Flags.string({ char: 't', description: 'Deploy token (or set KAIROS_TOKEN env var)', env: 'KAIROS_TOKEN' }),
  };
  static args = {
    command: Args.string({ required: true, description: 'Command to run' }),
  };

  async run() {
    const { flags, argv } = await this.parse(Run);

    const sepIdx = argv.indexOf('--');
    const cmdArgs = sepIdx >= 0 ? argv.slice(sepIdx + 1) : argv.filter((a) => !a.startsWith('-'));
    if (!cmdArgs.length) this.error('Specify a command after --');

    const token = flags.token;
    let dek: Uint8Array;
    let secrets: Array<{ key: string; encryptedValue: string; iv: string }>;

    if (token) {
      const config = loadConfig();
      const result = await fetch(`${config.apiUrl}/api/deploy-tokens/export`, {
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

    const env: Record<string, string> = { ...process.env as Record<string, string> };
    for (const s of secrets) {
      env[s.key] = decryptSecret(dek, s.encryptedValue, s.iv);
    }

    const [cmd, ...args] = cmdArgs as string[];
    const child = spawn(cmd, args, { env, stdio: 'inherit', shell: false });
    child.on('exit', (code) => process.exit(code ?? 0));
  }
}
