'use client';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useListEnvironmentsQuery,
  useCreateEnvironmentMutation,
  useCompleteRegistrationMutation,
  useDeleteEnvironmentMutation,
} from '@/lib/store/api';
import { selectCrypto, setDEK } from '@/lib/store/cryptoSlice';
import { selectAuth } from '@/lib/store/authSlice';
import { generateDEK, selfWrapDEK } from '@/lib/crypto/dek';
import { AppShell } from '@/components/AppShell';
import type { Environment } from '@kairos/types';

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

function DeleteConfirmModal({
  title,
  description,
  onConfirm,
  onClose,
  loading,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (!loading && e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EnvRow({ env, projectId, onDelete }: { env: Environment; projectId: string; onDelete: (id: string) => void }) {
  const router = useRouter();
  return (
    <div className="relative flex items-center justify-between bg-gray-900 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 rounded-xl px-5 py-4 transition-all group">
      <button
        onClick={() => router.push(`/dashboard/projects/${projectId}/environments/${env.id}`)}
        className="absolute inset-0 rounded-xl"
        aria-label={`Open ${env.name}`}
      />
      <div>
        <p className="font-medium text-white text-sm">{env.name}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          Created {new Date(env.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex items-center gap-1.5 text-gray-600 group-hover:text-gray-400 transition-colors">
          <span className="text-xs">View secrets</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(env.id); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950/40 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete environment"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}

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

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!deviceId) {
      setError('Device not registered — please re-login.');
      return;
    }
    let resolvedKey: Uint8Array | null = privateKey
      ? (privateKey instanceof Uint8Array ? privateKey : new Uint8Array(Object.values(privateKey as Record<string, number>)))
      : null;
    if (!resolvedKey) {
      const stored = sessionStorage.getItem('kairos_privkey');
      if (stored) {
        const { base64ToBytes } = await import('@/lib/crypto/keypair');
        resolvedKey = base64ToBytes(stored);
      }
    }
    if (!resolvedKey) {
      setError('Crypto keys not loaded — please re-login.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const env = await createEnvironment({ projectId, name: trimmed }).unwrap();
      const dek = generateDEK();
      const wrappedDEK = await selfWrapDEK(resolvedKey, dek);
      await completeRegistration({ deviceId, environmentId: env.id, wrappedDEK }).unwrap();
      dispatch(setDEK(dek));
      onClose();
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl">
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
      </div>
    </div>
  );
}

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const { accessToken } = useSelector(selectAuth);
  const { privateKey } = useSelector(selectCrypto);
  const router = useRouter();
  const { data: environments, isLoading, isError } = useListEnvironmentsQuery(params.projectId);
  const [deleteEnvironment] = useDeleteEnvironmentMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingEnvId, setDeletingEnvId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDeleteEnv() {
    if (!deletingEnvId) return;
    setDeleteLoading(true);
    try {
      await deleteEnvironment({ projectId: params.projectId, envId: deletingEnvId }).unwrap();
      setDeletingEnvId(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  useEffect(() => {
    if (!accessToken) router.push('/login');
  }, [accessToken, router]);

  if (!accessToken) return null;

  const projectLabel = environments?.[0]?.projectName ?? 'Project';

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-4xl mx-auto">
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 transition-colors">
            Projects
          </Link>
          <svg className="w-3.5 h-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-gray-300 font-medium">{projectLabel}</span>
        </nav>

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

        {isLoading ? (
          <div className="space-y-3"><SkeletonRow /><SkeletonRow /></div>
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
              <EnvRow key={env.id} env={env} projectId={params.projectId} onDelete={setDeletingEnvId} />
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

      {deletingEnvId && (
        <DeleteConfirmModal
          title="Delete environment?"
          description="This will permanently delete the environment and all its secrets. This cannot be undone."
          onConfirm={handleDeleteEnv}
          onClose={() => setDeletingEnvId(null)}
          loading={deleteLoading}
        />
      )}
    </AppShell>
  );
}
