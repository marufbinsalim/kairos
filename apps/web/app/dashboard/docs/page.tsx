'use client';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';

const REPO = 'marufbinsalim/kairos';
const BASE = `https://github.com/${REPO}/releases/latest/download`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 shrink-0"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function CodeBlock({ title, code }: { title?: string; code: string }) {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      {title ? (
        <>
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
            <span className="text-xs text-gray-500">{title}</span>
            <CopyButton text={code} />
          </div>
          <pre className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 font-mono overflow-x-auto whitespace-pre">{code}</pre>
        </>
      ) : (
        <div className="flex items-center justify-between px-4 py-2.5">
          <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono overflow-x-auto whitespace-pre flex-1">{code}</pre>
          <CopyButton text={code} />
        </div>
      )}
    </div>
  );
}

const linuxSteps = (arch: string) => [
  { n: 1, title: 'Download & extract', code: `mkdir -p ~/.local/share/kairos ~/.local/bin\ncurl -sL ${BASE}/kairos-linux-${arch}.tar.gz | tar xz -C ~/.local/share/kairos --strip-components=1\nln -sf ~/.local/share/kairos/bin/kairos ~/.local/bin/kairos` },
  { n: 2, title: 'Add to PATH', code: `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc\nsource ~/.bashrc` },
  { n: 3, title: 'Verify', code: 'kairos' },
];

const macSteps = (arch: string) => [
  { n: 1, title: 'Download & extract', code: `mkdir -p ~/.local/share/kairos ~/.local/bin\ncurl -sL ${BASE}/kairos-darwin-${arch}.tar.gz | tar xz -C ~/.local/share/kairos --strip-components=1\nln -sf ~/.local/share/kairos/bin/kairos ~/.local/bin/kairos` },
  { n: 2, title: 'Add to PATH', code: `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc\nsource ~/.zshrc` },
  { n: 3, title: 'Verify', code: 'kairos' },
];

const winPsSteps = [
  { n: 1, title: 'Download & extract', code: `$dest = "$env:LOCALAPPDATA\\kairos"\n$ProgressPreference = 'SilentlyContinue'\nNew-Item -ItemType Directory -Force -Path $dest | Out-Null\ncurl.exe -L ${BASE}/kairos-win32-x64.tar.gz -o kairos.tar.gz\ntar -xzf kairos.tar.gz -C $dest --strip-components=1 --exclude='kairos/node_modules/.bin' --exclude='node_modules/.bin'\nRemove-Item kairos.tar.gz` },
  { n: 2, title: 'Add to PATH (run once)', code: `$bin = "$env:LOCALAPPDATA\\kairos\\bin"\n$cur = [Environment]::GetEnvironmentVariable("PATH","User")\n[Environment]::SetEnvironmentVariable("PATH","$cur;$bin","User")\n$env:PATH = "$env:PATH;$bin"` },
  { n: 3, title: 'Verify', code: 'kairos' },
];

const winCmdSteps = [
  { n: 1, title: 'Download & extract', code: `mkdir "%LOCALAPPDATA%\\kairos"\ncurl -L ${BASE}/kairos-win32-x64.tar.gz -o kairos.tar.gz\ntar -xzf kairos.tar.gz -C "%LOCALAPPDATA%\\kairos" --strip-components=1 --exclude=kairos/node_modules/.bin --exclude=node_modules/.bin\ndel kairos.tar.gz` },
  { n: 2, title: 'Add to PATH (run once)', code: `setx PATH "%LOCALAPPDATA%\\kairos\\bin;%PATH%"` },
  { n: 3, title: 'Close & reopen terminal, then verify', code: 'kairos' },
];

const updateSteps = {
  'Linux / macOS': `curl -sL ${BASE}/kairos-linux-x64.tar.gz | tar xz -C ~/.local/share/kairos --strip-components=1`,
  'Windows (PowerShell)': `$ProgressPreference = 'SilentlyContinue'\ncurl.exe -L ${BASE}/kairos-win32-x64.tar.gz -o kairos.tar.gz\ntar -xzf kairos.tar.gz -C "$env:LOCALAPPDATA\\kairos" --strip-components=1 --exclude='kairos/node_modules/.bin' --exclude='node_modules/.bin'\nRemove-Item kairos.tar.gz`,
  'Windows (CMD)': `curl -L ${BASE}/kairos-win32-x64.tar.gz -o kairos.tar.gz\ntar -xzf kairos.tar.gz -C "%LOCALAPPDATA%\\kairos" --strip-components=1 --exclude=kairos/node_modules/.bin --exclude=node_modules/.bin\ndel kairos.tar.gz`,
};

const removeSteps = {
  'Linux / macOS': `# Remove binary and symlink\nrm -rf ~/.local/share/kairos\nrm -f ~/.local/bin/kairos\n\n# Remove config, auth, and keys\nrm -rf ~/.config/kairos\n\n# Remove PATH entry from ~/.bashrc (Linux) or ~/.zshrc (macOS)\n#   Delete the line: export PATH="$HOME/.local/bin:$PATH"\n#   Then reload:\nsource ~/.bashrc   # or: source ~/.zshrc`,
  'Windows (PowerShell)': `# Remove binary\nRemove-Item -Recurse -Force "$env:LOCALAPPDATA\\kairos" -ErrorAction SilentlyContinue\n\n# Remove from PATH\n$bin = "$env:LOCALAPPDATA\\kairos\\bin"\n$cur = [Environment]::GetEnvironmentVariable("PATH","User")\n$clean = (($cur -split ";") | Where-Object { $_ -ne $bin }) -join ";"\n[Environment]::SetEnvironmentVariable("PATH",$clean,"User")\n$env:PATH = (($env:PATH -split ";") | Where-Object { $_ -ne $bin }) -join ";"`,
  'Windows (CMD)': `rem Remove binary\nrmdir /s /q "%LOCALAPPDATA%\\kairos"\n\nrem Remove from PATH:\nrem   Open: System Properties > Environment Variables > User variables > Path\nrem   Delete the entry: %LOCALAPPDATA%\\kairos\\bin`,
};

const SECTIONS = [
  { id: 'install', label: 'Installation' },
  { id: 'update', label: 'Updating' },
  { id: 'uninstall', label: 'Uninstall' },
  { id: 'cli', label: 'CLI Reference' },
  { id: 'deploy-tokens', label: 'Deploy Tokens' },
  { id: 'docker', label: 'Docker' },
  { id: 'github-actions', label: 'GitHub Actions' },
];

export default function DashboardDocsPage() {
  const [platform, setPlatform] = useState<'linux' | 'mac' | 'windows'>('linux');
  const [linuxArch, setLinuxArch] = useState<'x64' | 'arm64'>('x64');
  const [macArch, setMacArch] = useState<'arm64' | 'x64'>('arm64');
  const [winShell, setWinShell] = useState<'ps' | 'cmd'>('cmd');
  const [updatePlatform, setUpdatePlatform] = useState<keyof typeof updateSteps>('Linux / macOS');
  const [removePlatform, setRemovePlatform] = useState<keyof typeof removeSteps>('Linux / macOS');

  const steps =
    platform === 'linux' ? linuxSteps(linuxArch) :
    platform === 'mac'   ? macSteps(macArch) :
    winShell === 'ps'    ? winPsSteps : winCmdSteps;

  return (
    <AppShell>
      <div className="px-4 sm:px-8 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Documentation</h1>
          <p className="text-gray-500 text-sm mt-1">CLI installation, commands, and CI/CD integration guides</p>
        </div>

        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block w-44 flex-shrink-0">
            <div className="sticky top-8 space-y-1">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-16">

            {/* Install */}
            <section id="install">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Installation</h2>
              <p className="text-gray-500 text-sm mb-6">Install using the one-liner script (recommended), or follow the manual steps below.</p>

              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Quick install</h3>
              <div className="space-y-3 mb-4">
                <CodeBlock title="Linux / macOS" code="curl -sL https://kairoscli.vercel.app/install | sh" />
                <CodeBlock title="Windows (PowerShell)" code="irm https://kairoscli.vercel.app/install.ps1 | iex" />
              </div>
              <p className="text-gray-500 text-sm mb-10">No sudo required. Installs to <code className="text-gray-600 dark:text-gray-400">~/.local/share/kairos</code> and adds to PATH automatically.</p>

              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Manual install</h3>

              <div className="flex gap-2 mb-5 flex-wrap">
                {([['linux', '🐧', 'Linux'], ['mac', '🍎', 'macOS'], ['windows', '🪟', 'Windows']] as const).map(([id, icon, label]) => (
                  <button key={id} onClick={() => setPlatform(id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${platform === id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    <span>{icon}</span>{label}
                  </button>
                ))}
              </div>

              {platform === 'linux' && (
                <div className="flex gap-2 mb-5">
                  {(['x64', 'arm64'] as const).map((a) => (
                    <button key={a} onClick={() => setLinuxArch(a)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${linuxArch === a ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      {a === 'x64' ? 'x86_64' : 'ARM64'}
                    </button>
                  ))}
                </div>
              )}
              {platform === 'mac' && (
                <div className="flex gap-2 mb-5">
                  {(['arm64', 'x64'] as const).map((a) => (
                    <button key={a} onClick={() => setMacArch(a)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${macArch === a ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      {a === 'arm64' ? 'Apple Silicon' : 'Intel'}
                    </button>
                  ))}
                </div>
              )}
              {platform === 'windows' && (
                <div className="flex gap-2 mb-5">
                  {([['cmd', 'CMD'], ['ps', 'PowerShell']] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setWinShell(id)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${winShell === id ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.n} className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
                      <span className="text-xs text-gray-500">
                        <span className="text-indigo-500 dark:text-indigo-400 mr-2">{step.n}.</span>{step.title}
                      </span>
                      <CopyButton text={step.code} />
                    </div>
                    <pre className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 font-mono overflow-x-auto whitespace-pre">{step.code}</pre>
                  </div>
                ))}
              </div>
            </section>

            {/* Update */}
            <section id="update">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Updating</h2>
              <p className="text-gray-500 text-sm mb-5">Re-run the download command over your existing install — no uninstall needed.</p>
              <div className="flex gap-2 mb-4 flex-wrap">
                {(Object.keys(updateSteps) as Array<keyof typeof updateSteps>).map((k) => (
                  <button key={k} onClick={() => setUpdatePlatform(k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${updatePlatform === k ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                    {k}
                  </button>
                ))}
              </div>
              <CodeBlock title={updatePlatform} code={updateSteps[updatePlatform]} />
            </section>

            {/* Uninstall */}
            <section id="uninstall">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Uninstall</h2>
              <p className="text-gray-500 text-sm mb-4">Use the one-liner script, or run the manual steps below.</p>
              <div className="space-y-3 mb-8">
                <CodeBlock title="Linux / macOS" code="curl -sL https://kairoscli.vercel.app/uninstall | sh" />
                <CodeBlock title="Windows (PowerShell)" code="irm https://kairoscli.vercel.app/uninstall.ps1 | iex" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Manual uninstall</h3>
              <div className="flex gap-2 mb-4 flex-wrap">
                {(Object.keys(removeSteps) as Array<keyof typeof removeSteps>).map((k) => (
                  <button key={k} onClick={() => setRemovePlatform(k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${removePlatform === k ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                    {k}
                  </button>
                ))}
              </div>
              <CodeBlock title={removePlatform} code={removeSteps[removePlatform]} />
            </section>

            {/* CLI Reference */}
            <section id="cli">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">CLI Reference</h2>
              <p className="text-gray-500 text-sm mb-5">All commands and flags.</p>
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {[
                  ['kairos login', 'Sign in to your account'],
                  ['kairos switch', 'Select a project / environment (registers device if needed)'],
                  ['kairos secrets', 'Decrypt and display secrets for the current environment'],
                  ['kairos secrets -g', 'Write secrets to .env in current directory'],
                  ['kairos secrets -g FILE', 'Write secrets to a specific file'],
                  ['kairos secrets -t TOKEN', 'Fetch secrets using a deploy token (no login required)'],
                  ['kairos run -- CMD', 'Run a command with secrets injected as env vars'],
                  ['kairos run -t TOKEN -- CMD', 'Run a command using a deploy token'],
                  ['kairos device "My Laptop"', 'Set a label for this device'],
                  ['kairos logout', 'Sign out and clear local credentials'],
                ].map(([cmd, desc], i, arr) => (
                  <div key={cmd} className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-200 dark:border-gray-800' : ''}`}>
                    <code className="text-indigo-600 dark:text-indigo-400 font-mono text-sm shrink-0 sm:w-60">{cmd}</code>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Deploy Tokens */}
            <section id="deploy-tokens">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Deploy tokens</h2>
              <p className="text-gray-500 text-sm mb-5">
                Generate a token per environment from the <span className="text-gray-700 dark:text-gray-300 font-medium">Secrets</span> page. The token wraps the DEK — secrets stay E2E encrypted. No login or device approval required.
              </p>
              <div className="space-y-3">
                <CodeBlock title="Inject as env vars" code={`kairos run -t $KAIROS_TOKEN -- node server.js`} />
                <CodeBlock title="Write to .env file" code={`kairos secrets -t $KAIROS_TOKEN -g .env`} />
              </div>
            </section>

            {/* Docker */}
            <section id="docker">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Docker</h2>
              <p className="text-gray-500 text-sm mb-5">Pass a deploy token and inject secrets at container start.</p>
              <div className="space-y-3">
                <CodeBlock title="Docker run" code={`docker run -e KAIROS_TOKEN=$KAIROS_TOKEN myimage sh -c \\\n  "kairos secrets -t $KAIROS_TOKEN -g /app/.env && node server.js"`} />
                <CodeBlock title="Docker Compose" code={`# docker-compose.yml
services:
  app:
    build: .
    environment:
      - KAIROS_TOKEN=\${KAIROS_TOKEN}
    command: sh -c "kairos secrets -t $$KAIROS_TOKEN -g .env && node server.js"`} />
              </div>
            </section>

            {/* GitHub Actions */}
            <section id="github-actions">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">GitHub Actions</h2>
              <p className="text-gray-500 text-sm mb-5">
                Store your deploy token as a GitHub secret (<code className="text-gray-600 dark:text-gray-400">KAIROS_TOKEN</code>), then use it in your workflow.
              </p>
              <div className="space-y-3">
                <CodeBlock title="Load secrets into GITHUB_ENV" code={`- name: Install kairos
  run: curl -sL https://kairoscli.vercel.app/install | sh

- name: Load secrets
  run: kairos secrets -t \${{ secrets.KAIROS_TOKEN }} >> $GITHUB_ENV

- name: Build
  run: npm run build`} />
                <CodeBlock title="Write to .env file" code={`- name: Install kairos
  run: curl -sL https://kairoscli.vercel.app/install | sh

- name: Write .env
  run: kairos secrets -t \${{ secrets.KAIROS_TOKEN }} -g .env`} />
                <CodeBlock title="Inject via kairos run" code={`- name: Install kairos
  run: curl -sL https://kairoscli.vercel.app/install | sh

- name: Build with secrets
  run: kairos run -t \${{ secrets.KAIROS_TOKEN }} -- npm run build`} />
              </div>
            </section>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
