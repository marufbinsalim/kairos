'use client';
import { useState } from 'react';
import Link from 'next/link';

const REPO = 'marufbinsalim/kairos';
const BASE = `https://github.com/${REPO}/releases/latest/download`;

const platforms = [
  {
    id: 'linux-x64',
    label: 'Linux',
    icon: '🐧',
    arch: ['x64', 'arm64'],
    steps: (arch: string) => [
      {
        title: 'Download & extract',
        code: `mkdir -p ~/.kairos-cli\ncurl -sL ${BASE}/kairos-linux-${arch}.tar.gz | tar xz -C ~/.kairos-cli --strip-components=1`,
      },
      {
        title: 'Add to PATH',
        code: `echo 'export PATH="$HOME/.kairos-cli/bin:$PATH"' >> ~/.bashrc\nsource ~/.bashrc`,
      },
      {
        title: 'Verify',
        code: `kairos`,
      },
    ],
  },
  {
    id: 'darwin',
    label: 'macOS',
    icon: '🍎',
    arch: ['arm64', 'x64'],
    steps: (arch: string) => [
      {
        title: 'Download & extract',
        code: `mkdir -p ~/.kairos-cli\ncurl -sL ${BASE}/kairos-darwin-${arch}.tar.gz | tar xz -C ~/.kairos-cli --strip-components=1`,
      },
      {
        title: 'Add to PATH',
        code: `echo 'export PATH="$HOME/.kairos-cli/bin:$PATH"' >> ~/.zshrc\nsource ~/.zshrc`,
      },
      {
        title: 'Verify',
        code: `kairos`,
      },
    ],
  },
  {
    id: 'windows',
    label: 'Windows',
    icon: '🪟',
    arch: ['x64'],
    steps: (_arch: string) => [
      {
        title: 'Download & extract (PowerShell)',
        code: `$dest = "$env:USERPROFILE\\.kairos-cli"\nNew-Item -ItemType Directory -Force -Path $dest | Out-Null\ncurl -L ${BASE}/kairos-win32-x64.tar.gz -o kairos.tar.gz\ntar -xzf kairos.tar.gz -C $dest --strip-components=1\nRemove-Item kairos.tar.gz`,
      },
      {
        title: 'Add to PATH (PowerShell)',
        code: `$bin = "$env:USERPROFILE\\.kairos-cli\\bin"\n$cur = [Environment]::GetEnvironmentVariable("PATH","User")\n[Environment]::SetEnvironmentVariable("PATH","$cur;$bin","User")`,
      },
      {
        title: 'Open a new terminal, then verify',
        code: `kairos`,
      },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-700"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function DownloadPage() {
  const [activePlatform, setActivePlatform] = useState('linux-x64');
  const [activeArch, setActiveArch] = useState<Record<string, string>>({
    'linux-x64': 'x64',
    darwin: 'arm64',
    windows: 'x64',
  });

  const platform = platforms.find((p) => p.id === activePlatform)!;
  const arch = activeArch[activePlatform];
  const steps = platform.steps(arch);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <span className="text-indigo-400 font-bold">K</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">kairos</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Install CLI</h1>
        <p className="text-gray-400 mb-10">
          The Kairos CLI lets you pull secrets directly into your terminal or CI environment.
        </p>

        {/* Platform tabs */}
        <div className="flex gap-2 mb-8">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activePlatform === p.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Arch selector */}
        {platform.arch.length > 1 && (
          <div className="flex gap-2 mb-6">
            {platform.arch.map((a) => (
              <button
                key={a}
                onClick={() => setActiveArch((prev) => ({ ...prev, [activePlatform]: a }))}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                  arch === a
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {a === 'arm64' ? 'Apple Silicon (arm64)' : 'Intel (x64)'}
              </button>
            ))}
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                <span className="text-xs font-medium text-gray-400">
                  <span className="text-indigo-400 mr-2">{i + 1}.</span>
                  {step.title}
                </span>
                <CopyButton text={step.code} />
              </div>
              <pre className="px-4 py-3 text-sm text-gray-200 font-mono overflow-x-auto whitespace-pre">{step.code}</pre>
            </div>
          ))}
        </div>

        {/* After install */}
        <div className="mt-10 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">After installing</h2>
          <div className="space-y-2 text-sm">
            {[
              ['kairos login', 'Sign in to your account'],
              ['kairos switch', 'Select a project and environment'],
              ['kairos secrets', 'Decrypt and display secrets'],
              ['kairos secrets -g', 'Write secrets to .env'],
            ].map(([cmd, desc]) => (
              <div key={cmd} className="flex items-center gap-3">
                <code className="text-indigo-400 font-mono w-40 shrink-0">{cmd}</code>
                <span className="text-gray-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
          <a
            href={`https://github.com/${REPO}/releases`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            All releases →
          </a>
          <Link href="/login" className="hover:text-gray-300 transition-colors">
            Sign in →
          </Link>
        </div>
      </div>
    </div>
  );
}
