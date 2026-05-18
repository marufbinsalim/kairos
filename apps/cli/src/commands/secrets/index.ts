import { Command, Flags } from '@oclif/core';
import SecretsList from './list';

export default class SecretsIndex extends Command {
  static description = 'List secrets, or write .env with -g';
  static flags = {
    generate: Flags.boolean({ char: 'g', description: 'Write secrets to .env in current directory' }),
    env: Flags.string({ char: 'e', description: 'Environment ID' }),
  };

  async run() {
    const { flags } = await this.parse(SecretsIndex);
    await SecretsList.run([
      ...(flags.generate ? ['-g'] : []),
      ...(flags.env ? ['-e', flags.env] : []),
    ]);
  }
}
