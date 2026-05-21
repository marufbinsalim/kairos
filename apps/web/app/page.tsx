'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

const REPO = 'marufbinsalim/kairos';

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

export default function LandingPage() {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 dark:border-gray-900 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-indigo-400 font-bold text-sm">K</span>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold tracking-tight">kairos</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Docs</Link>
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

      <div className="max-w-5xl mx-auto px-6">

        {/* Hero */}
        <section className="py-20 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs text-indigo-400 mb-8">
            E2EE secrets manager
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Secrets your team can share.<br />
            <span className="text-indigo-400">Keys only you hold.</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-10">
            Kairos encrypts secrets end-to-end on your device. The server never sees plaintext. Pull secrets into any environment with a single CLI command.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors w-full sm:w-auto text-center">
              Get started free
            </Link>
            <a href="#install" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium px-6 py-3 w-full sm:w-auto text-center">
              Install CLI →
            </a>
          </div>
        </section>

        {/* Features */}
        <section className="pb-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'End-to-end encrypted', desc: 'AES-256-GCM encryption. Your private key never leaves your device.' },
            { title: 'CLI-first', desc: 'Pull secrets into .env files, CI pipelines, or your terminal in one command.' },
            { title: 'Multi-device', desc: 'Approve new devices from the web UI. Each device gets its own encrypted key.' },
            { title: 'Deploy tokens', desc: 'Generate scoped tokens for CI/CD. No login, no device, no password.' },
          ].map((f) => (
            <div key={f.title} className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Install */}
        <section id="install" className="pb-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Install the CLI</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">One command — detects your OS and architecture automatically.</p>
          <div className="space-y-3 mb-4">
            <CodeBlock title="Linux / macOS" code="curl -sL https://kairoscli.vercel.app/install | sh" />
            <CodeBlock title="Windows (PowerShell)" code="irm https://kairoscli.vercel.app/install.ps1 | iex" />
          </div>
          <p className="text-gray-500 text-sm mb-8">No sudo required. Installs to <code className="text-gray-600 dark:text-gray-400">~/.local/share/kairos</code> and adds to PATH automatically.</p>

          <div className="space-y-3 mb-4">
            <CodeBlock title="Uninstall — Linux / macOS" code="curl -sL https://kairoscli.vercel.app/uninstall | sh" />
            <CodeBlock title="Uninstall — Windows (PowerShell)" code="irm https://kairoscli.vercel.app/uninstall.ps1 | iex" />
          </div>

          <p className="text-gray-500 text-sm">
            Need manual install, update instructions, or other platforms?{' '}
            <Link href="/docs" className="text-indigo-400 hover:text-indigo-300 transition-colors">View full docs →</Link>
          </p>
        </section>

        {/* Deploy tokens */}
        <section className="pb-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Deploy tokens</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Pull secrets in CI/CD without logging in. Generate a scoped token per environment from the web UI — secrets stay E2E encrypted.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">GitHub Actions</p>
              <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre overflow-x-auto">{`- name: Load secrets
  run: kairos secrets -t \${{ secrets.KAIROS_TOKEN }} >> $GITHUB_ENV

- run: npm run build`}</pre>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Docker / any CI</p>
              <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre overflow-x-auto">{`# inject and run
kairos run -t $KAIROS_TOKEN -- npm run build

# write to .env
kairos secrets -t $KAIROS_TOKEN -g .env`}</pre>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Docker Compose</p>
            <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre overflow-x-auto">{`kairos secrets -t $KAIROS_TOKEN -g .env && docker compose up`}</pre>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 text-center">
          <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Ready to start?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Create an account, add your secrets, and pull them anywhere.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors w-full sm:w-auto text-center">
                Create account
              </Link>
              <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium px-6 py-3 w-full sm:w-auto text-center">
                Sign in →
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-900 px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <span>kairos</span>
          <div className="flex gap-6">
            <Link href="/docs" className="hover:text-gray-400 transition-colors">Docs</Link>
            <a href={`https://github.com/${REPO}/releases`} target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">Releases</a>
            <a href={`https://github.com/${REPO}`} target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">GitHub</a>
            <Link href="/login" className="hover:text-gray-400 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
