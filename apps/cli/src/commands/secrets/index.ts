import { Command, Flags, Args } from '@oclif/core';
import SecretsList from './list';

export default class SecretsIndex extends Command {
  static description = 'Decrypt and display secrets, or write to file with -g';
  static flags = {
    generate: Flags.boolean({ char: 'g', description: 'Write secrets to file instead of printing' }),
  };
  static args = {
    outfile: Args.string({ required: false, description: 'Output filename (used with -g, defaults to .env)' }),
  };

  async run() {
    const { flags, args } = await this.parse(SecretsIndex);
    await SecretsList.run([
      ...(flags.generate ? ['-g'] : []),
      ...(args.outfile ? [args.outfile] : []),
    ]);
  }
}
