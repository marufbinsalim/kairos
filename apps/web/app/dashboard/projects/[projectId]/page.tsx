// /home/snow/kairos/apps/web/app/dashboard/projects/[projectId]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useListEnvironmentsQuery,
  useCreateEnvironmentMutation,
  useCompleteRegistrationMutation,
} from '@/lib/store/api';
import { selectCrypto, setDEK } from '@/lib/store/cryptoSlice';
import { selectAuth } from '@/lib/store/authSlice';
import { generateDEK, selfWrapDEK } from '@/lib/crypto/dek';
import { generateRecoveryKey, wrapDEKWithRecoveryKey } from '@/lib/crypto/recovery';
import { AppShell } from '@/components/AppShell';
import type { Environment } from '@kairos/types';

// ─── Skeleton row ────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-gray-800 rounded" />
        <div className="h-3 w-24 bg-gray-800 rounded" />
      </div>
      <div className="h-3 w-20 bg-gray-800 rounded" />
    </div>
  );
}

// ─── Environment row ─────────────────────────────────────────────────────────
function EnvRow({ env, projectId }: { env: Environment; projectId: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/dashboard/projects/${projectId}/environments/${env.id}`)}
      className="w-full flex items-center justify-between bg-gray-900 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 rounded-xl px-5 py-4 text-left transition-all group"
    >
      <div>
        <p className="font-medium text-white text-sm">{env.name}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          Created {new Date(env.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-2 text-gray-600 group-hover:text-gray-400 transition-colors">
        <span className="text-xs">View secrets</span>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </button>
  );
}

// ─── Recovery mnemonic display ────────────────────────────────────────────────
function RecoveryDisplay({ mnemonic, onDismiss }: { mnemonic: string; onDismiss: () => void }) {
  const words = mnemonic.split(' ');
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(mnemonic).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-yellow-600/50 bg-yellow-950/20 p-5 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <p className="text-yellow-300 font-semibold text-sm">Save your recovery key — shown once only</p>
          <p className="text-yellow-500/80 text-xs mt-0.5">
            You will need this 24-word phrase to recover access if you lose all your devices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {words.map((word, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-gray-900/60 rounded-lg px-2.5 py-1.5">
            <span className="text-gray-600 text-xs w-4 text-right flex-shrink-0">{i + 1}.</span>
            <span className="font-mono text-xs text-yellow-200">{word}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-yellow-500 hover:text-yellow-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
          </svg>
          {copied ? 'Copied!' : 'Copy phrase'}
        </button>
        <div className="flex-1" />
        <button
          onClick={onDismiss}
          className="flex items-center gap-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/40 text-yellow-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          I&apos;ve saved it
        </button>
      </div>
    </div>
  );
}

// ─── New environment modal ────────────────────────────────────────────────────
function NewEnvironmentModal({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const dispatch = useDispatch();
  const { privateKey, deviceId } = useSelector(selectCrypto);
  const [createEnvironment] = useCreateEnvironmentMutation();
  const [completeRegistration] = useCompleteRegistrationMutation();

  const [step, setStep] = useState<'form' | 'recovery'>('form');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mnemonic, setMnemonic] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!privateKey || !deviceId) {
      setError('Crypto keys not loaded — please re-login.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Step 1: Create the environment
      const env = await createEnvironment({ projectId, name: trimmed }).unwrap();

      // Step 2: Generate DEK
      const dek = generateDEK();

      // Step 3: Generate recovery key (shown once)
      const { bytes: recoveryKeyBytes, mnemonic: recoveryMnemonic } = generateRecoveryKey();

      // Step 4: Wrap DEK two ways — self-wrapped for this device, and with recovery key
      const wrappedDEK = await selfWrapDEK(privateKey, dek);
      const wrappedDEKRecovery = await wrapDEKWithRecoveryKey(recoveryKeyBytes, dek);

      // Step 5: Complete device registration for this environment
      await completeRegistration({
        deviceId,
        environmentId: env.id,
        wrappedDEK,
        wrappedDEKRecovery,
      }).unwrap();

      // Step 6: Store DEK in Redux memory
      dispatch(setDEK(dek));

      setMnemonic(recoveryMnemonic);
      setStep('recovery');
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      setError(msg ?? 'Failed to create environment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (step !== 'recovery' && e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl">
        {step === 'form' ? (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">New Environment</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Environment name</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. production, staging, dev"
                  className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-white placeholder-gray-600 text-sm outline-none transition-colors"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  {loading ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-white mb-1">Environment created</h2>
            <p className="text-gray-500 text-sm mb-5">A new encryption key has been generated for this environment.</p>
            <RecoveryDisplay mnemonic={mnemonic} onDismiss={onClose} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const { accessToken } = useSelector(selectAuth);
  const { privateKey } = useSelector(selectCrypto);
  const router = useRouter();
  const { data: environments, isLoading, isError } = useListEnvironmentsQuery(params.projectId);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) router.push('/login');
  }, [accessToken, router]);

  if (!accessToken) return null;

  // Derive a project name from the first environment's projectName field if available,
  // otherwise fall back to a shortened ID
  const projectLabel = environments?.[0]?.projectName ?? `Project`;

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 transition-colors">
            Projects
          </Link>
          <svg className="w-3.5 h-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-gray-300 font-medium">{projectLabel}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Environments</h1>
            <p className="text-gray-500 text-sm mt-0.5">Each environment has its own encryption key</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            disabled={!privateKey}
            title={!privateKey ? 'Re-login to enable key generation' : undefined}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Environment
          </button>
        </div>

        {/* No private key warning */}
        {!privateKey && (
          <div className="mb-6 flex items-start gap-3 bg-yellow-950/20 border border-yellow-700/40 rounded-xl px-5 py-4">
            <svg className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-yellow-400/80 text-sm">
              Private key not loaded.{' '}
              <Link href="/login" className="underline hover:text-yellow-300">Re-login</Link>{' '}
              to create environments.
            </p>
          </div>
        )}

        {/* Environment list */}
        {isLoading ? (
          <div className="space-y-3">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : isError ? (
          <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-6 text-center">
            <p className="text-red-400 text-sm">Failed to load environments. Please try refreshing.</p>
          </div>
        ) : !environments || environments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-1">No environments yet</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              Create an environment to start storing end-to-end encrypted secrets.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {environments.map((env) => (
              <EnvRow key={env.id} env={env} projectId={params.projectId} />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <NewEnvironmentModal
          projectId={params.projectId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </AppShell>
  );
}
