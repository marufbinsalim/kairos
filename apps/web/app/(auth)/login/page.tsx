'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useGoogleLoginMutation, useSetupKeysMutation, useRegisterDeviceMutation, useLazyGetMeQuery } from '@/lib/store/api';
import { setAuth } from '@/lib/store/authSlice';
import { setKeypair, setDeviceId } from '@/lib/store/cryptoSlice';
import {
  generateKeypair,
  bytesToBase64,
  generateRecoveryMnemonic,
  validateMnemonic,
  wrapPrivateKeyWithMnemonic,
  unwrapPrivateKeyWithMnemonic,
} from '@/lib/crypto/keypair';
import { savePrivateKeyLocal, loadPrivateKeyLocal, saveDeviceIdLocal, saveKeysVersionLocal, loadKeysVersionLocal } from '@/lib/storage/keys';
import { x25519 } from '@noble/curves/ed25519';
import { DeviceType } from '@kairos/types';
import { useTheme } from '@/components/ThemeProvider';
import { KairosLogo } from '@/components/KairosLogo';
import { GOOGLE_CLIENT_ID } from '@/lib/googleClient';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

type Step = 'signin' | 'ceremony' | 'restore';

function MnemonicWord({ index, word }: { index: number; word: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
      <span className="text-gray-500 text-xs w-5 text-right flex-shrink-0">{index + 1}.</span>
      <span className="text-gray-900 dark:text-white text-sm font-mono">{word}</span>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function LoginInner() {
  const [step, setStep] = useState<Step>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ceremony state
  const [mnemonic, setMnemonic] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const keypairRef = useRef<{ privateKey: Uint8Array; publicKey: Uint8Array } | null>(null);

  // restore state
  const [phrase, setPhrase] = useState('');
  const restoreDataRef = useRef<{ blob: string; publicKey: string; keysVersion: number } | null>(null);

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggle } = useTheme();

  const [googleLogin] = useGoogleLoginMutation();
  const [setupKeys] = useSetupKeysMutation();
  const [registerDevice] = useRegisterDeviceMutation();
  const [fetchMe] = useLazyGetMeQuery();

  const next = searchParams.get('next');
  const destination = next && next.startsWith('/') ? next : '/dashboard';

  const finalize = useCallback(
    async (privateKey: Uint8Array) => {
      const publicKey = x25519.getPublicKey(privateKey);
      savePrivateKeyLocal(privateKey);
      dispatch(setKeypair({ privateKey, publicKey }));

      const device = await registerDevice({
        publicKey: bytesToBase64(publicKey),
        type: DeviceType.web,
        label: `Web — ${navigator.userAgent.slice(0, 40)}`,
      }).unwrap();
      saveDeviceIdLocal(device.deviceId);
      dispatch(setDeviceId(device.deviceId));

      router.push(destination);
    },
    [dispatch, registerDevice, router, destination],
  );

  const handleCredential = useCallback(
    async (idToken: string) => {
      setBusy(true);
      setError('');
      try {
        const res = await googleLogin({ idToken }).unwrap();
        dispatch(setAuth({ accessToken: res.accessToken, userId: res.userId, email: res.email }));

        if (!res.publicKey) {
          // Brand-new account — generate keys + recovery phrase ceremony
          keypairRef.current = generateKeypair();
          setMnemonic(generateRecoveryMnemonic());
          setStep('ceremony');
          setBusy(false);
          return;
        }

        // Existing account — is this browser already trusted? The key must match
        // AND the phrase must not have been regenerated since we last verified it.
        const local = loadPrivateKeyLocal();
        if (
          local &&
          bytesToBase64(x25519.getPublicKey(local)) === res.publicKey &&
          loadKeysVersionLocal() === res.keysVersion
        ) {
          await finalize(local);
          return;
        }

        if (!res.mnemonicEncryptedPrivateKey) {
          setError('This account has no recovery phrase on file. Access cannot be restored on a new browser.');
          setBusy(false);
          return;
        }
        restoreDataRef.current = {
          blob: res.mnemonicEncryptedPrivateKey,
          publicKey: res.publicKey,
          keysVersion: res.keysVersion,
        };
        setStep('restore');
        setBusy(false);
      } catch {
        setError('Sign-in failed. Please try again.');
        setBusy(false);
      }
    },
    [googleLogin, dispatch, finalize],
  );

  // Load the Google Identity Services button
  useEffect(() => {
    if (step !== 'signin') return;
    const render = () => {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp) => handleCredential(resp.credential),
      });
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: theme === 'dark' ? 'filled_black' : 'outline',
        size: 'large',
        width: 300,
        text: 'continue_with',
        shape: 'pill',
      });
    };

    if (window.google) {
      render();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [step, theme, handleCredential]);

  async function handleCeremonyConfirm() {
    if (!confirmed || !keypairRef.current) return;
    setBusy(true);
    setError('');
    try {
      const { privateKey, publicKey } = keypairRef.current;
      const mnemonicEncryptedPrivateKey = await wrapPrivateKeyWithMnemonic(privateKey, mnemonic);
      await setupKeys({ publicKey: bytesToBase64(publicKey), mnemonicEncryptedPrivateKey }).unwrap();
      saveKeysVersionLocal(1);
      await finalize(privateKey);
    } catch {
      setError('Key setup failed. Please try again.');
      setBusy(false);
    }
  }

  async function handleRestore(e: React.FormEvent) {
    e.preventDefault();
    if (!restoreDataRef.current) return;
    setBusy(true);
    setError('');
    try {
      if (!validateMnemonic(phrase)) {
        setError('That is not a valid 12-word recovery phrase.');
        setBusy(false);
        return;
      }
      // Re-fetch at submit time — the phrase may have been regenerated on
      // another device after this page loaded
      try {
        const me = await fetchMe().unwrap();
        if (me.mnemonicEncryptedPrivateKey && me.publicKey) {
          restoreDataRef.current = {
            blob: me.mnemonicEncryptedPrivateKey,
            publicKey: me.publicKey,
            keysVersion: me.keysVersion,
          };
        }
      } catch {
        /* fall back to the blob from sign-in */
      }
      const privateKey = await unwrapPrivateKeyWithMnemonic(restoreDataRef.current.blob, phrase);
      if (bytesToBase64(x25519.getPublicKey(privateKey)) !== restoreDataRef.current.publicKey) {
        setError('That phrase does not match this account.');
        setBusy(false);
        return;
      }
      saveKeysVersionLocal(restoreDataRef.current.keysVersion);
      await finalize(privateKey);
    } catch {
      setError('That phrase does not match this account.');
      setBusy(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([mnemonic], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kairos-recovery-phrase.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  const words = mnemonic.split(' ');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <KairosLogo size={32} />
            <span className="text-gray-900 dark:text-white font-semibold text-lg tracking-tight">kairos</span>
          </div>
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
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
        </div>

        {step === 'signin' && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Welcome to Kairos</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              End-to-end encrypted secrets. Sign in with Google to continue.
            </p>

            {busy ? (
              <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 text-sm py-3">
                <Spinner />
                Signing in…
              </div>
            ) : (
              <div className="flex justify-center" ref={googleButtonRef} />
            )}

            <div className="mt-4">
              <ErrorBanner message={error} />
            </div>

            <p className="mt-5 text-xs text-gray-500 leading-relaxed">
              New accounts get a 12-word recovery phrase. Your encryption keys are generated locally
              and never leave this device unencrypted — not even Google can read your secrets.
            </p>
          </div>
        )}

        {step === 'ceremony' && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Save your recovery phrase</h1>
                <p className="text-xs text-amber-500 dark:text-amber-400/80">Required — read carefully</p>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-5">
              <p className="text-amber-700 dark:text-amber-300/90 text-xs leading-relaxed">
                This 12-word phrase is the <strong>only way</strong> to access your secrets on a new browser
                or device. There is no password. If you lose this phrase and clear this browser,{' '}
                <strong>your data is permanently inaccessible.</strong>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {words.map((word, i) => (
                <MnemonicWord key={i} index={i} word={word} />
              ))}
            </div>

            <div className="flex gap-2 mb-5">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                {copied ? (
                  <><svg className="w-3.5 h-3.5 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg><span className="text-green-500 dark:text-green-400">Copied</span></>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download
              </button>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-indigo-500 focus:ring-indigo-500/50 flex-shrink-0"
              />
              <span className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                I have saved my recovery phrase in a safe place and understand that losing it means
                losing access to my secrets on new devices.
              </span>
            </label>

            {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

            <button
              onClick={handleCeremonyConfirm}
              disabled={!confirmed || busy}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2"><Spinner />Setting up…</span>
              ) : 'Continue to dashboard'}
            </button>
          </div>
        )}

        {step === 'restore' && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Unlock on this browser</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              This browser doesn&apos;t hold your encryption key yet. Enter your 12-word recovery phrase
              to restore access — it never leaves this device.
            </p>

            <form onSubmit={handleRestore} className="space-y-4">
              <textarea
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                rows={3}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm font-mono placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors resize-none"
                placeholder="correct horse battery staple …"
                autoFocus
                required
              />
              <ErrorBanner message={error} />
              <button
                type="submit"
                disabled={busy || !phrase.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {busy ? (
                  <span className="flex items-center justify-center gap-2"><Spinner />Restoring…</span>
                ) : 'Restore access'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
