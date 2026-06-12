'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/lib/store/authSlice';
import { useCliApproveMutation, useCliDenyMutation } from '@/lib/store/api';
import { BrandLink } from '@/components/BrandLink';

type State = 'confirm' | 'approved' | 'denied' | 'error';

function CliAuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, email } = useSelector(selectAuth);
  const [cliApprove] = useCliApproveMutation();
  const [cliDeny] = useCliDenyMutation();

  const code = (searchParams.get('code') ?? '').toUpperCase();
  const [state, setState] = useState<State>('confirm');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) {
      router.replace(`/login?next=${encodeURIComponent(`/cli-auth?code=${code}`)}`);
    }
  }, [accessToken, router, code]);

  if (!accessToken) return null;

  async function handle(action: 'approve' | 'deny') {
    setBusy(true);
    setError('');
    try {
      if (action === 'approve') {
        await cliApprove({ code }).unwrap();
        setState('approved');
      } else {
        await cliDeny({ code }).unwrap();
        setState('denied');
      }
    } catch (e: unknown) {
      const msg = (e as { data?: { message?: string } })?.data?.message;
      setError(msg ?? 'Something went wrong. Run kairos login again to get a fresh code.');
      setState('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8"><BrandLink size={32} /></div>

        <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-8 shadow-xl dark:shadow-2xl text-center">
          {state === 'confirm' && (
            <>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">CLI sign-in request</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                A terminal is asking to sign in as <span className="font-medium text-gray-900 dark:text-white">{email}</span>.
                Only approve if the code below matches your terminal.
              </p>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-4 mb-6">
                <span className="text-2xl font-mono font-bold tracking-[0.3em] text-blue-600 dark:text-blue-500">
                  {code || '———'}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handle('deny')}
                  disabled={busy || !code}
                  className="flex-1 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Deny
                </button>
                <button
                  onClick={() => handle('approve')}
                  disabled={busy || !code}
                  className="flex-1 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-white disabled:opacity-50 text-white dark:text-black py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  {busy ? 'Working…' : 'Approve'}
                </button>
              </div>
            </>
          )}

          {state === 'approved' && (
            <>
              <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Terminal signed in</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                You can close this tab and return to your terminal.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-black py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Go to dashboard
              </button>
            </>
          )}

          {state === 'denied' && (
            <>
              <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Request denied</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                The terminal was not signed in. You can close this tab.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Go to dashboard
              </button>
            </>
          )}

          {state === 'error' && (
            <>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
              <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CliAuthPage() {
  return (
    <Suspense>
      <CliAuthInner />
    </Suspense>
  );
}
