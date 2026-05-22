'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';
import { KairosLogo } from '@/components/KairosLogo';

function LinuxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.654.172.517.578.973 1.164 1.364.388.272.8.527 1.259.756.542.279 1.145.526 1.792.734.62.261 1.256.4 1.88.5.641.11 1.295.146 1.935.15.639.005 1.293-.022 1.933-.116.639-.093 1.277-.264 1.906-.526.551-.229 1.115-.505 1.646-.834.581-.37.985-.803 1.138-1.285.153-.47.077-1.042-.195-1.642-.07-.168-.205-.47-.075-.824.12-.399.107-.864.007-1.338-.1-.467-.277-.914-.527-1.314a3.26 3.26 0 00-.863-1.027 2.3 2.3 0 00.174-.547c.065-.31.065-.643.02-.975-.044-.331-.158-.663-.316-.957-.313-.584-.803-1.028-1.403-1.317-.287-.135-.59-.23-.9-.286.02-2.118-.115-5.17-3.026-6.066C13.135.054 12.808 0 12.504 0zm.39 1.977c.165.007.329.023.49.049.855.154 1.53.607 1.93 1.281.399.68.51 1.541.38 2.39-.125.844-.44 1.665-.79 2.39a4.694 4.694 0 01-.46.781c-.146.208-.307.36-.5.504-.24.166-.524.283-.832.345-.307.062-.635.073-.967.046-.332-.027-.665-.1-.976-.215a2.918 2.918 0 01-.823-.45c-.23-.175-.432-.39-.605-.629-.173-.239-.32-.506-.43-.786-.233-.593-.32-1.259-.29-1.922.031-.663.184-1.319.439-1.887.255-.567.617-1.046 1.07-1.38.448-.331.987-.506 1.565-.517zm-1.59 7.55c.3.174.604.316.903.42.302.1.597.17.887.205.291.035.577.043.852.03.276-.013.543-.05.795-.104.513-.11.965-.29 1.39-.53.18-.1.35-.21.514-.33a.516.516 0 00.075-.063c.115.232.217.468.308.706.154.413.255.834.29 1.243.035.41-.001.806-.143 1.148a1.25 1.25 0 01-.128.25c-.13.19-.334.345-.6.481-.53.27-1.222.44-1.985.52-.763.083-1.59.08-2.387.022-.798-.057-1.566-.175-2.193-.38-.312-.104-.586-.23-.805-.386a1.518 1.518 0 01-.395-.396c-.2-.295-.298-.658-.34-1.051a5.196 5.196 0 01.039-1.225c.068-.41.192-.814.368-1.187.168-.358.381-.692.62-.99.006.055.012.107.019.156.05.318.127.603.247.855zm-4.064 7.523c.147.065.293.132.436.204.604.305 1.159.662 1.641 1.094.466.415.865.896 1.168 1.433.073.13.142.262.202.395a7.04 7.04 0 01-.888-.099c-.42-.066-.825-.17-1.18-.303-.355-.131-.655-.302-.854-.511-.1-.105-.168-.216-.197-.33-.028-.112-.017-.228.046-.357.06-.124.168-.261.315-.39a5.013 5.013 0 01.311-.136zm8.6-.001c.118.042.23.09.312.136.147.13.254.266.315.39.062.13.073.245.046.357-.03.114-.096.225-.197.33-.2.209-.5.38-.855.511-.354.132-.759.237-1.18.303a7.032 7.032 0 01-.887.099c.06-.133.129-.265.202-.395.303-.537.702-1.018 1.168-1.433.482-.432 1.037-.789 1.641-1.094l.435-.204z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.459 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
    </svg>
  );
}

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  );
}

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

export default function DocsPage() {
  const { theme, toggle } = useTheme();
  const [platform, setPlatform] = useState<'linux' | 'mac' | 'windows'>('linux');
  const [linuxArch, setLinuxArch] = useState<'x64' | 'arm64'>('x64');
  const [macArch, setMacArch] = useState<'arm64' | 'x64'>('arm64');
  const [winShell, setWinShell] = useState<'ps' | 'cmd'>('cmd');
  const [updatePlatform, setUpdatePlatform] = useState<keyof typeof updateSteps>('Linux / macOS');
  const [removePlatform, setRemovePlatform] = useState<keyof typeof removeSteps>('Linux / macOS');

  const steps =
    platform === 'linux' ? linuxSteps(linuxArch) :
      platform === 'mac' ? macSteps(macArch) :
        winShell === 'ps' ? winPsSteps : winCmdSteps;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 dark:border-gray-900 px-6 py-4 sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <KairosLogo size={28} />
              <span className="text-gray-900 dark:text-white font-semibold tracking-tight">kairos</span>
            </Link>
            <span className="text-gray-700">/</span>
            <span className="text-gray-600 dark:text-gray-400 text-sm">Docs</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`https://github.com/${REPO}`} target="_blank" rel="noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">GitHub</a>
            <button onClick={toggle} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
            <Link href="/login" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition-colors">Sign in</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block w-48 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
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
          <div className="flex-1 min-w-0 space-y-20">

            {/* Install */}
            <section id="install">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Installation</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Install using the one-liner script (recommended), or follow the manual steps below.</p>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Quick install</h3>
              <div className="space-y-3 mb-6">
                <CodeBlock title="Linux / macOS" code="curl -sL https://kairoscli.vercel.app/install | sh" />
                <CodeBlock title="Windows (PowerShell)" code="irm https://kairoscli.vercel.app/install.ps1 | iex" />
              </div>
              <p className="text-gray-500 text-sm mb-10">No sudo required. Installs to <code className="text-gray-600 dark:text-gray-400">~/.local/share/kairos</code> and adds to PATH automatically.</p>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Manual install</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">Choose your platform below.</p>

              <div className="flex gap-2 mb-6 flex-wrap">
                {([
                  { id: 'linux', Icon: LinuxIcon, label: 'Linux' },
                  { id: 'mac', Icon: AppleIcon, label: 'macOS' },
                  { id: 'windows', Icon: WindowsIcon, label: 'Windows' },
                ] as const).map(({ id, Icon, label }) => (
                  <button key={id} onClick={() => setPlatform(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${platform === id ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-gray-700'}`}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>

              {platform === 'linux' && (
                <div className="flex gap-2 mb-6">
                  {(['x64', 'arm64'] as const).map((a) => (
                    <button key={a} onClick={() => setLinuxArch(a)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${linuxArch === a ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      {a === 'x64' ? 'x86_64' : 'ARM64'}
                    </button>
                  ))}
                </div>
              )}
              {platform === 'mac' && (
                <div className="flex gap-2 mb-6">
                  {(['arm64', 'x64'] as const).map((a) => (
                    <button key={a} onClick={() => setMacArch(a)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${macArch === a ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      {a === 'arm64' ? 'Apple Silicon' : 'Intel'}
                    </button>
                  ))}
                </div>
              )}
              {platform === 'windows' && (
                <div className="flex gap-2 mb-6">
                  {([['cmd', 'CMD'], ['ps', 'PowerShell']] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setWinShell(id)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${winShell === id ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.n} className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="text-indigo-400 mr-2">{step.n}.</span>{step.title}
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Updating</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Re-run the download command over your existing install — no uninstall needed.</p>
              <div className="flex gap-2 mb-4 flex-wrap">
                {(Object.keys(updateSteps) as Array<keyof typeof updateSteps>).map((k) => (
                  <button key={k} onClick={() => setUpdatePlatform(k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${updatePlatform === k ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                    {k}
                  </button>
                ))}
              </div>
              <CodeBlock title={updatePlatform} code={updateSteps[updatePlatform]} />
            </section>

            {/* Uninstall */}
            <section id="uninstall">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Uninstall</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Use the one-liner script, or run the manual steps below.</p>
              <div className="space-y-3 mb-8">
                <CodeBlock title="Linux / macOS" code="curl -sL https://kairoscli.vercel.app/uninstall | sh" />
                <CodeBlock title="Windows (PowerShell)" code="irm https://kairoscli.vercel.app/uninstall.ps1 | iex" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Manual uninstall</h3>
              <div className="flex gap-2 mb-4 flex-wrap">
                {(Object.keys(removeSteps) as Array<keyof typeof removeSteps>).map((k) => (
                  <button key={k} onClick={() => setRemovePlatform(k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${removePlatform === k ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                    {k}
                  </button>
                ))}
              </div>
              <CodeBlock title={removePlatform} code={removeSteps[removePlatform]} />
            </section>

            {/* CLI Reference */}
            <section id="cli">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">CLI Reference</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">All commands and flags.</p>
              <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-8">
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
                    <code className="text-indigo-400 font-mono text-sm shrink-0 sm:w-64">{cmd}</code>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Deploy Tokens */}
            <section id="deploy-tokens">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Deploy tokens</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Generate a token per environment from the web dashboard. The token wraps the DEK — secrets stay E2E encrypted. No login, no device approval required.</p>
              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Inject as env vars</p>
                  <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono overflow-x-auto whitespace-pre">{`kairos run -t $KAIROS_TOKEN -- node server.js`}</pre>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Write to .env file</p>
                  <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono overflow-x-auto whitespace-pre">{`kairos secrets -t $KAIROS_TOKEN -g .env`}</pre>
                </div>
              </div>
            </section>

            {/* Docker */}
            <section id="docker">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Docker</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Pass a deploy token and inject secrets at container start.</p>
              <div className="space-y-4">
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">GitHub Actions</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Store your deploy token as a GitHub secret (<code className="text-gray-500 dark:text-gray-300">KAIROS_TOKEN</code>), then use it in your workflow.</p>
              <div className="space-y-4">
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
    </div>
  );
}
