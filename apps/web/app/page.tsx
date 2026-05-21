'use client';
import { useState } from 'react';
import Link from 'next/link';

const REPO = 'marufbinsalim/kairos';
const BASE = `https://github.com/${REPO}/releases/latest/download`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-700 shrink-0"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function CodeBlock({ title, code }: { title?: string; code: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
          <span className="text-xs text-gray-500">{title}</span>
          <CopyButton text={code} />
        </div>
      )}
      {!title && (
        <div className="flex items-center justify-between px-4 py-2.5">
          <pre className="text-sm text-gray-200 font-mono overflow-x-auto whitespace-pre flex-1">{code}</pre>
          <CopyButton text={code} />
        </div>
      )}
      {title && <pre className="px-4 py-3 text-sm text-gray-200 font-mono overflow-x-auto whitespace-pre">{code}</pre>}
    </div>
  );
}

const linuxSteps = (arch: string) => [
  { n: 1, title: 'Download & extract', code: `mkdir -p ~/.kairos-cli\ncurl -sL ${BASE}/kairos-linux-${arch}.tar.gz | tar xz -C ~/.kairos-cli --strip-components=1` },
  { n: 2, title: 'Add to PATH', code: `echo 'export PATH="$HOME/.kairos-cli/bin:$PATH"' >> ~/.bashrc\nsource ~/.bashrc` },
  { n: 3, title: 'Verify', code: 'kairos' },
];

const macSteps = (arch: string) => [
  { n: 1, title: 'Download & extract', code: `mkdir -p ~/.kairos-cli\ncurl -sL ${BASE}/kairos-darwin-${arch}.tar.gz | tar xz -C ~/.kairos-cli --strip-components=1` },
  { n: 2, title: 'Add to PATH', code: `echo 'export PATH="$HOME/.kairos-cli/bin:$PATH"' >> ~/.zshrc\nsource ~/.zshrc` },
  { n: 3, title: 'Verify', code: 'kairos' },
];

const winPsSteps = [
  { n: 1, title: 'Download & extract', code: `$dest = "$env:USERPROFILE\\.kairos-cli"\nNew-Item -ItemType Directory -Force -Path $dest | Out-Null\ncurl.exe -L ${BASE}/kairos-win32-x64.tar.gz -o kairos.tar.gz\ntar -xzf kairos.tar.gz -C $dest --strip-components=1 --exclude=kairos/node_modules/.bin\nRemove-Item kairos.tar.gz` },
  { n: 2, title: 'Add to PATH (run once)', code: `$bin = "$env:USERPROFILE\\.kairos-cli\\bin"\n$cur = [Environment]::GetEnvironmentVariable("PATH","User")\n[Environment]::SetEnvironmentVariable("PATH","$cur;$bin","User")` },
  { n: 3, title: 'Close & reopen terminal, then verify', code: 'kairos' },
];

const winCmdSteps = [
  { n: 1, title: 'Download & extract', code: `mkdir "%USERPROFILE%\\.kairos-cli"\ncurl -L ${BASE}/kairos-win32-x64.tar.gz -o kairos.tar.gz\ntar -xzf kairos.tar.gz -C "%USERPROFILE%\\.kairos-cli" --strip-components=1 --exclude=kairos/node_modules/.bin\ndel kairos.tar.gz` },
  { n: 2, title: 'Add to PATH (run once)', code: `setx PATH "%USERPROFILE%\\.kairos-cli\\bin"` },
  { n: 3, title: 'Close & reopen terminal, then verify', code: 'kairos' },
];

const updateSteps = {
  'Linux / macOS': `curl -sL ${BASE}/kairos-linux-x64.tar.gz | tar xz -C ~/.kairos-cli --strip-components=1`,
  'Windows (PowerShell)': `curl.exe -L ${BASE}/kairos-win32-x64.tar.gz -o kairos.tar.gz\ntar -xzf kairos.tar.gz -C "$env:USERPROFILE\\.kairos-cli" --strip-components=1 --exclude=kairos/node_modules/.bin\nRemove-Item kairos.tar.gz`,
  'Windows (CMD)': `curl -L ${BASE}/kairos-win32-x64.tar.gz -o kairos.tar.gz\ntar -xzf kairos.tar.gz -C "%USERPROFILE%\\.kairos-cli" --strip-components=1 --exclude=kairos/node_modules/.bin\ndel kairos.tar.gz`,
};

const removeSteps = {
  'Linux / macOS': `# 1. Remove binary\nrm -rf ~/.kairos-cli\n\n# 2. Remove config, auth, and keys\nrm -rf ~/.config/kairos\n\n# 3. Remove PATH entry from ~/.bashrc (Linux) or ~/.zshrc (macOS)\n#    Delete the line: export PATH="$HOME/.kairos-cli/bin:$PATH"\n#    Then reload:\nsource ~/.bashrc   # or: source ~/.zshrc`,
  'Windows (PowerShell)': `# 1. Remove binary\nRemove-Item -Recurse -Force "$env:USERPROFILE\\.kairos-cli" -ErrorAction SilentlyContinue\n\n# 2. Remove config, auth, and keys (current location)\nRemove-Item -Recurse -Force "$env:APPDATA\\kairos" -ErrorAction SilentlyContinue\n\n# 3. Remove legacy config path (older CLI versions)\nRemove-Item -Recurse -Force "$env:USERPROFILE\\.config\\kairos" -ErrorAction SilentlyContinue\n\n# 4. Remove from PATH\n$cur = [Environment]::GetEnvironmentVariable("PATH","User")\n$clean = ($cur -split ";") | Where-Object { $_ -notlike "*\\.kairos-cli*" } | Join-String -Separator ";"\n[Environment]::SetEnvironmentVariable("PATH",$clean,"User")`,
  'Windows (CMD)': `rem 1. Remove binary\nrmdir /s /q "%USERPROFILE%\\.kairos-cli"\n\nrem 2. Remove config, auth, and keys (current location)\nrmdir /s /q "%APPDATA%\\kairos"\n\nrem 3. Remove legacy config path (older CLI versions)\nrmdir /s /q "%USERPROFILE%\\.config\\kairos"\n\nrem 4. Remove from PATH:\nrem    Open: System Properties > Environment Variables > User variables > Path\nrem    Delete the entry: %USERPROFILE%\\.kairos-cli\\bin`,
};

export default function LandingPage() {
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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-900 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-indigo-400 font-bold text-sm">K</span>
            </div>
            <span className="text-white font-semibold tracking-tight">kairos</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`https://github.com/${REPO}`} target="_blank" rel="noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">GitHub</a>
            <Link href="/login" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition-colors">Sign in</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6">

        {/* Hero */}
        <section className="py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs text-indigo-400 mb-8">
            E2EE secrets manager
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Secrets your team can share.<br />
            <span className="text-indigo-400">Keys only you hold.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
            Kairos encrypts secrets end-to-end on your device. The server never sees plaintext. Pull secrets into any environment with a single CLI command.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors">
              Get started free
            </Link>
            <a href="#install" className="text-gray-400 hover:text-white transition-colors font-medium px-6 py-3">
              Install CLI →
            </a>
          </div>
        </section>

        {/* Features */}
        <section className="pb-24 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: 'End-to-end encrypted', desc: 'AES-256-GCM encryption. Your private key never leaves your device.' },
            { title: 'CLI-first', desc: 'Pull secrets into .env files, CI pipelines, or your terminal in one command.' },
            { title: 'Multi-device', desc: 'Approve new devices from the web UI. Each device gets its own encrypted key.' },
            { title: 'Deploy tokens', desc: 'Generate scoped tokens for CI/CD. No login, no device, no password.' },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* One-liner install */}
        <section id="install" className="pb-16">
          <h2 className="text-2xl font-bold text-white mb-2">Install the CLI</h2>
          <p className="text-gray-400 mb-6">One command — detects your OS and arch automatically.</p>
          <div className="space-y-3 mb-4">
            <CodeBlock title="Linux / macOS" code="curl -sL https://kairoscli.vercel.app/install | sh" />
            <CodeBlock title="Windows (PowerShell)" code="irm https://kairoscli.vercel.app/install.ps1 | iex" />
          </div>
          <p className="text-gray-500 text-sm mb-10">No sudo required. Installs to <code className="text-gray-400">~/.local/share/kairos</code> and adds to PATH automatically.</p>

          <h3 className="text-lg font-semibold text-white mb-2">Uninstall</h3>
          <p className="text-gray-400 mb-4 text-sm">Removes the binary and PATH entry.</p>
          <div className="space-y-3 mb-16">
            <CodeBlock title="Linux / macOS" code="curl -sL https://kairoscli.vercel.app/uninstall | sh" />
            <CodeBlock title="Windows (PowerShell)" code="irm https://kairoscli.vercel.app/uninstall.ps1 | iex" />
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">Manual install</h3>
          <p className="text-gray-400 mb-8 text-sm">Prefer to install manually? Choose your platform below.</p>

          {/* Platform tabs */}
          <div className="flex gap-2 mb-6">
            {([['linux', '🐧', 'Linux'], ['mac', '🍎', 'macOS'], ['windows', '🪟', 'Windows']] as const).map(([id, icon, label]) => (
              <button key={id} onClick={() => setPlatform(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${platform === id ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>

          {/* Arch / shell selector */}
          {platform === 'linux' && (
            <div className="flex gap-2 mb-6">
              {(['x64', 'arm64'] as const).map((a) => (
                <button key={a} onClick={() => setLinuxArch(a)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${linuxArch === a ? 'bg-gray-700 text-white border border-gray-600' : 'text-gray-500 hover:text-gray-300'}`}>
                  {a === 'x64' ? 'x86_64' : 'ARM64'}
                </button>
              ))}
            </div>
          )}
          {platform === 'mac' && (
            <div className="flex gap-2 mb-6">
              {(['arm64', 'x64'] as const).map((a) => (
                <button key={a} onClick={() => setMacArch(a)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${macArch === a ? 'bg-gray-700 text-white border border-gray-600' : 'text-gray-500 hover:text-gray-300'}`}>
                  {a === 'arm64' ? 'Apple Silicon' : 'Intel'}
                </button>
              ))}
            </div>
          )}
          {platform === 'windows' && (
            <div className="flex gap-2 mb-6">
              {([['cmd', 'CMD'], ['ps', 'PowerShell']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setWinShell(id)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${winShell === id ? 'bg-gray-700 text-white border border-gray-600' : 'text-gray-500 hover:text-gray-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.n} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                  <span className="text-xs text-gray-400">
                    <span className="text-indigo-400 mr-2">{step.n}.</span>{step.title}
                  </span>
                  <CopyButton text={step.code} />
                </div>
                <pre className="px-4 py-3 text-sm text-gray-200 font-mono overflow-x-auto whitespace-pre">{step.code}</pre>
              </div>
            ))}
          </div>
        </section>

        {/* Update */}
        <section className="pb-24">
          <h2 className="text-2xl font-bold text-white mb-2">Updating</h2>
          <p className="text-gray-400 mb-8">Re-run the download command over your existing install — no uninstall needed.</p>

          <div className="flex gap-2 mb-4 flex-wrap">
            {(Object.keys(updateSteps) as Array<keyof typeof updateSteps>).map((k) => (
              <button key={k} onClick={() => setUpdatePlatform(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${updatePlatform === k ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {k}
              </button>
            ))}
          </div>

          <CodeBlock title={updatePlatform} code={updateSteps[updatePlatform]} />

          {updatePlatform.startsWith('Windows') && (
            <p className="text-xs text-gray-500 mt-3">No need to update PATH — it's already set from the initial install.</p>
          )}
        </section>

        {/* Quick reference */}
        <section className="pb-24">
          <h2 className="text-2xl font-bold text-white mb-2">Quick reference</h2>
          <p className="text-gray-400 mb-8">Commands you'll use every day.</p>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {[
              ['kairos login', 'Sign in to your account'],
              ['kairos switch', 'Select a project / environment (registers device if needed)'],
              ['kairos secrets', 'Decrypt and display secrets'],
              ['kairos secrets -g', 'Write secrets to .env in current directory'],
              ['kairos secrets -g FILE', 'Write secrets to a specific file'],
              ['kairos name "My Laptop"', 'Set a name for this device'],
              ['kairos logout', 'Sign out'],
            ].map(([cmd, desc], i, arr) => (
              <div key={cmd} className={`flex items-start gap-4 px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-800' : ''}`}>
                <code className="text-indigo-400 font-mono text-sm shrink-0 w-52">{cmd}</code>
                <span className="text-gray-400 text-sm">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Remove */}
        <section className="pb-24">
          <h2 className="text-2xl font-bold text-white mb-2">Uninstall</h2>
          <p className="text-gray-400 mb-8">Removes the binary, config, and PATH entry from your machine.</p>

          <div className="flex gap-2 mb-4 flex-wrap">
            {(Object.keys(removeSteps) as Array<keyof typeof removeSteps>).map((k) => (
              <button key={k} onClick={() => setRemovePlatform(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${removePlatform === k ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {k}
              </button>
            ))}
          </div>

          <CodeBlock title={removePlatform} code={removeSteps[removePlatform]} />

          {removePlatform === 'Windows (CMD)' && (
            <p className="text-xs text-gray-500 mt-3">For CMD, remove the PATH entry manually: open System Properties → Environment Variables → edit Path under your user and delete the kairos entry.</p>
          )}
        </section>

        {/* Deploy tokens */}
        <section className="pb-24">
          <h2 className="text-2xl font-bold text-white mb-2">Deploy tokens</h2>
          <p className="text-gray-400 mb-8">Pull secrets in CI/CD without logging in. Generate a scoped token per environment from the web UI — secrets stay E2E encrypted.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">GitHub Actions</p>
              <pre className="text-sm text-gray-200 font-mono whitespace-pre overflow-x-auto">{`- name: Load secrets
  run: kairos secrets -t \${{ secrets.KAIROS_TOKEN }} >> $GITHUB_ENV

- run: npm run build`}</pre>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Docker / any CI</p>
              <pre className="text-sm text-gray-200 font-mono whitespace-pre overflow-x-auto">{`# inject and run
kairos run -t $KAIROS_TOKEN -- npm run build

# write to .env
kairos secrets -t $KAIROS_TOKEN -g .env`}</pre>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Docker Compose</p>
            <pre className="text-sm text-gray-200 font-mono whitespace-pre overflow-x-auto">{`kairos secrets -t $KAIROS_TOKEN -g .env && docker compose up`}</pre>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 text-center">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to start?</h2>
            <p className="text-gray-400 mb-8">Create an account, add your secrets, and pull them anywhere.</p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors">
                Create account
              </Link>
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors font-medium px-6 py-3">
                Sign in →
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-gray-900 px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-gray-600">
          <span>kairos</span>
          <div className="flex gap-6">
            <a href={`https://github.com/${REPO}/releases`} target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">Releases</a>
            <a href={`https://github.com/${REPO}`} target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">GitHub</a>
            <Link href="/login" className="hover:text-gray-400 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
