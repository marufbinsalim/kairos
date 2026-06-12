import { Flags, Args } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command';
import SecretsList from './list';

export default class SecretsIndex extends BaseCommand {
  static description = 'Decrypt and display secrets, or write to file with -g';
  static examples = ['kairos secrets', 'kairos secrets -g', 'kairos secrets -g .env.local'];
  static flags = {
    generate: Flags.boolean({ char: 'g', description: 'Write secrets to file instead of printing' }),
    token: Flags.string({ char: 't', description: 'Deploy token (or set KAIROS_TOKEN env var)', env: 'KAIROS_TOKEN' }),
  };
  static args = {
    outfile: Args.string({ required: false, description: 'Output filename (used with -g, defaults to .env)' }),
  };

  async run() {
    const { flags, args } = await this.parse(SecretsIndex);
    await SecretsList.run([
      ...(flags.generate ? ['-g'] : []),
      ...(flags.token ? ['-t', flags.token] : []),
      ...(args.outfile ? [args.outfile] : []),
    ]);
  }
}
