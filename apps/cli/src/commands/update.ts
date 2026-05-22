import { Command } from '@oclif/core';
import { execSync } from 'child_process';
import { createWriteStream, mkdirSync, unlinkSync } from 'fs';
import * as https from 'https';
import { homedir, platform } from 'os';
import { join } from 'path';

const REPO = 'marufbinsalim/kairos';

export default class Update extends Command {
  static description = 'Update kairos to the latest version';

  async run() {
    const current = `v${this.config.version}`;

    process.stdout.write('  Checking for updates...');
    let latest: string;
    try {
      latest = await fetchLatestTag();
    } catch {
      console.log('\n  Failed to reach GitHub. Check your connection.');
      return;
    }
    console.log('');

    if (current === latest) {
      console.log(`  kairos ${current} is already up to date.\n`);
      return;
    }

    console.log(`  Updating ${current} → ${latest}...\n`);

    const os = platform();
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';

    const { filename, installDir, binDir } = getPaths(os, arch);
    const url = `https://github.com/${REPO}/releases/download/${latest}/${filename}`;
    const tmp = join(os === 'win32' ? (process.env.TEMP ?? 'C:\\Temp') : '/tmp', 'kairos-update.tar.gz');

    try {
      process.stdout.write('  Downloading...');
      await download(url, tmp);
      console.log(' done');

      process.stdout.write('  Installing...');
      mkdirSync(installDir, { recursive: true });

      if (os === 'win32') {
        execSync(
          `tar -xzf "${tmp}" -C "${installDir}" --strip-components=1 --exclude="kairos/node_modules/.bin" --exclude="node_modules/.bin"`,
          { stdio: 'pipe' },
        );
      } else {
        execSync(`tar xz -C "${installDir}" --strip-components=1 -f "${tmp}"`, { stdio: 'pipe' });
        mkdirSync(binDir, { recursive: true });
        execSync(`ln -sf "${join(installDir, 'bin', 'kairos')}" "${join(binDir, 'kairos')}"`, { stdio: 'pipe' });
      }
      console.log(' done');

      unlinkSync(tmp);
      console.log(`\n  kairos ${latest} installed. Restart your terminal if the version doesn't update.\n`);
    } catch (e) {
      try { unlinkSync(tmp); } catch {}
      this.error(`Update failed: ${(e as Error).message}`);
    }
  }
}

function getPaths(os: string, arch: string): { filename: string; installDir: string; binDir: string } {
  if (os === 'win32') {
    const installDir = join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'kairos');
    return { filename: `kairos-win32-${arch}.tar.gz`, installDir, binDir: join(installDir, 'bin') };
  }
  const installDir = join(homedir(), '.local', 'share', 'kairos');
  const binDir = join(homedir(), '.local', 'bin');
  const osName = os === 'darwin' ? 'darwin' : 'linux';
  return { filename: `kairos-${osName}-${arch}.tar.gz`, installDir, binDir };
}

function fetchLatestTag(): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(
      { hostname: 'api.github.com', path: `/repos/${REPO}/releases/latest`, headers: { 'User-Agent': 'kairos-cli' } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data).tag_name); } catch { reject(new Error('Failed to parse response')); }
        });
      },
    ).on('error', reject);
  });
}

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'kairos-cli' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const file = createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
      file.on('error', reject);
    }).on('error', reject);
  });
}
