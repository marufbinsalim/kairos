'use client';
import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTheme } from '@/components/ThemeProvider';
import { BrandLink } from '@/components/BrandLink';

const Hero3D = dynamic(() => import('@/components/Hero3D'), { ssr: false });

const REPO = 'marufbinsalim/kairos';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 shrink-0"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function CodeBlock({ title, code }: { title?: string; code: string }) {
  return (
    <div className="bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
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

function Terminal() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden text-left">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
        <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
        <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
        <span className="ml-3 text-xs text-gray-400 dark:text-gray-600 font-mono">terminal</span>
      </div>
      <pre className="px-5 py-4 text-[13px] leading-relaxed font-mono overflow-x-auto">
        <span className="text-gray-400 dark:text-gray-600">$</span> <span className="text-gray-900 dark:text-gray-100">kairos secrets</span>{'\n'}
        {'\n'}
        <span className="text-gray-500">  kairos · acme-app › </span><span className="text-green-600 dark:text-green-500">production</span>{'\n'}
        <span className="text-gray-300 dark:text-gray-700">  ─────────────────────────────────</span>{'\n'}
        <span className="text-gray-400 dark:text-gray-500">  KEY            VALUE</span>{'\n'}
        <span className="text-blue-600 dark:text-blue-400">  DATABASE_URL</span><span className="text-gray-900 dark:text-gray-200">   postgres://db:5432</span>{'\n'}
        <span className="text-blue-600 dark:text-blue-400">  STRIPE_KEY</span><span className="text-gray-900 dark:text-gray-200">     sk_live_••••…</span>{'\n'}
        <span className="text-blue-600 dark:text-blue-400">  REDIS_URL</span><span className="text-gray-900 dark:text-gray-200">      redis://cache</span>{'\n'}
        <span className="text-gray-300 dark:text-gray-700">  ─────────────────────────────────</span>{'\n'}
        <span className="text-gray-500">  3 secrets · </span><span className="text-green-600 dark:text-green-500">decrypted locally</span>
      </pre>
    </div>
  );
}

const STEPS = [
  {
    n: '01',
    title: 'Encrypt on your device',
    desc: 'Secrets are sealed with AES-256-GCM before they leave your machine. The data key is wrapped with your device’s x25519 keypair.',
    code: 'AES-256-GCM · x25519 · HKDF',
  },
  {
    n: '02',
    title: 'Sync ciphertext only',
    desc: 'The server stores envelopes it cannot open — no plaintext, no keys, nothing to leak. Approve new devices from any trusted one.',
    code: 'server sees: aGVsbG8h… (ciphertext)',
  },
  {
    n: '03',
    title: 'Decrypt where you need it',
    desc: 'Pull into a .env, inject into a process, or read in CI with a scoped deploy token. Decryption always happens locally.',
    code: 'kairos run -- npm start',
  },
];

export default function LandingPage() {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-900 px-6 py-3.5 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BrandLink size={28} />
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Docs</Link>
            <a href={`https://github.com/${REPO}`} target="_blank" rel="noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">GitHub</a>
            <button onClick={toggle} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
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
            <Link href="/login" className="text-sm bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-black px-4 py-1.5 rounded-lg transition-colors">Sign in</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6">

        {/* Hero */}
        <section className="relative py-16 md:py-28">
          {/* 3D vault — behind everything, drifting with the pointer */}
          <div className="hidden md:block absolute -right-32 top-1/2 -translate-y-1/2 w-[620px] h-[560px] z-0" aria-hidden>
            <Hero3D dark={theme === 'dark'} />
          </div>

          <div className="relative z-10 flex flex-col-reverse md:flex-row items-center gap-12 md:gap-16">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-1.5 text-xs text-gray-600 dark:text-gray-400 mb-8 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                end-to-end encrypted
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900 dark:text-white mb-6 leading-[1.05]">
                Secrets your team can share.<br />
                <span className="text-gray-500 dark:text-gray-500">Keys only you hold.</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-10 md:max-w-lg">
                Kairos encrypts secrets on your device before they sync. The server stores ciphertext it can never open. One CLI command pulls them anywhere.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <Link href="/login" className="bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-black font-medium px-6 py-3 rounded-lg transition-colors w-full sm:w-auto text-center">
                  Get started free
                </Link>
                <a href="#install" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium px-6 py-3 w-full sm:w-auto text-center">
                  Install CLI →
                </a>
              </div>
            </div>
            <div className="flex-1 w-full max-w-md md:max-w-lg">
              <Terminal />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="pb-24">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-10">Zero knowledge, three steps.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="relative bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
                <span className="font-mono text-xs text-gray-400 dark:text-gray-600">{s.n}</span>
                <h3 className="text-gray-900 dark:text-white font-semibold mt-3 mb-2">{s.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{s.desc}</p>
                <code className="block text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-900 rounded px-2.5 py-1.5 truncate">{s.code}</code>
              </div>
            ))}
          </div>
        </section>

        {/* What the server sees */}
        <section className="pb-24">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Zero knowledge</p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-10">The server is just a courier.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">What you see</span>
                <span className="text-xs font-mono text-green-600 dark:text-green-500">decrypted locally</span>
              </div>
              <pre className="px-5 py-4 text-[13px] font-mono leading-relaxed overflow-x-auto">
                <span className="text-blue-600 dark:text-blue-400">DATABASE_URL</span><span className="text-gray-900 dark:text-gray-200">=postgres://acme:hunter2@db:5432</span>{'\n'}
                <span className="text-blue-600 dark:text-blue-400">STRIPE_KEY</span><span className="text-gray-900 dark:text-gray-200">=sk_live_••••••••••••••••</span>{'\n'}
                <span className="text-blue-600 dark:text-blue-400">JWT_SECRET</span><span className="text-gray-900 dark:text-gray-200">=89f2a1c4e7b3d6f0</span>
              </pre>
            </div>
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">What the server stores</span>
                <span className="text-xs font-mono text-gray-500">AES-256-GCM ciphertext</span>
              </div>
              <pre className="px-5 py-4 text-[13px] font-mono leading-relaxed overflow-x-auto text-gray-400 dark:text-gray-600">
                {'DATABASE_URL=mF7…K2dQ9xV4bL8nR3wZ1pY6\nSTRIPE_KEY=tH5…J8sN2cX7vB4mK9qW3eA1\nJWT_SECRET=rG6…L3fP9zD5yU8hT2jM4kS7'}
              </pre>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            Private keys never leave your devices. Lose every device and the recovery phrase? The data is gone — that&apos;s the guarantee.
          </p>
        </section>

        {/* Features */}
        <section className="pb-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'CLI-first', desc: 'Pull secrets into .env files, CI pipelines, or your terminal in one command.' },
            { title: 'Device approval', desc: 'New machines wait for approval from a trusted device. Each gets its own wrapped key.' },
            { title: 'Deploy tokens', desc: 'Scoped tokens for CI/CD. No login, no device, no password — still E2EE.' },
            { title: 'Google sign-in', desc: 'No passwords anywhere. Identity by Google, encryption by your recovery phrase.' },
          ].map((f) => (
            <div key={f.title} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Install */}
        <section id="install" className="pb-24">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Install</p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">One command.</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Detects your OS and architecture automatically. No sudo required.</p>
          <div className="space-y-3 mb-4">
            <CodeBlock title="Linux / macOS" code="curl -sL https://kairoscli.vercel.app/install | sh" />
            <CodeBlock title="Windows (PowerShell)" code="irm https://kairoscli.vercel.app/install.ps1 | iex" />
          </div>
          <p className="text-gray-500 text-sm mb-8">Installs to <code className="text-gray-600 dark:text-gray-400 font-mono">~/.local/share/kairos</code> and adds itself to PATH.</p>

          <div className="space-y-3 mb-4">
            <CodeBlock title="Uninstall — Linux / macOS" code="curl -sL https://kairoscli.vercel.app/uninstall | sh" />
            <CodeBlock title="Uninstall — Windows (PowerShell)" code="irm https://kairoscli.vercel.app/uninstall.ps1 | iex" />
          </div>

          <p className="text-gray-500 text-sm">
            Manual install, updates, other platforms —{' '}
            <Link href="/docs" className="text-gray-900 dark:text-white hover:underline underline-offset-4 transition-colors">view full docs →</Link>
          </p>
        </section>

        {/* Deploy tokens */}
        <section className="pb-24">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">CI / CD</p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Deploy tokens.</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Pull secrets in CI without logging in. One scoped token per environment — secrets stay end-to-end encrypted.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 font-mono">GitHub Actions</p>
              <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre overflow-x-auto">{`- name: Load secrets
  run: kairos secrets -t \${{ secrets.KAIROS_TOKEN }} >> $GITHUB_ENV

- run: npm run build`}</pre>
            </div>
            <div className="bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 font-mono">Docker / any CI</p>
              <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre overflow-x-auto">{`# inject and run
kairos run -t $KAIROS_TOKEN -- npm run build

# write to .env
kairos secrets -t $KAIROS_TOKEN -g .env`}</pre>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 font-mono">Docker Compose</p>
            <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre overflow-x-auto">{`kairos secrets -t $KAIROS_TOKEN -g .env && docker compose up`}</pre>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 text-center">
          <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-10 md:p-16">
            <div
              className="absolute inset-0 opacity-[0.08] text-gray-900 dark:text-white"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">Own your secrets.</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">Sign in with Google, save a recovery phrase, and pull encrypted secrets anywhere in under a minute.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login" className="bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-black font-medium px-6 py-3 rounded-lg transition-colors w-full sm:w-auto text-center">
                  Create account
                </Link>
                <a href={`https://github.com/${REPO}`} target="_blank" rel="noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium px-6 py-3 w-full sm:w-auto text-center">
                  Star on GitHub →
                </a>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-900 px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span className="font-mono text-xs">kairos — e2ee secrets manager</span>
          <div className="flex gap-6">
            <Link href="/docs" className="hover:text-gray-900 dark:hover:text-white transition-colors">Docs</Link>
            <a href={`https://github.com/${REPO}/releases`} target="_blank" rel="noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors">Releases</a>
            <a href={`https://github.com/${REPO}`} target="_blank" rel="noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors">GitHub</a>
            <Link href="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
