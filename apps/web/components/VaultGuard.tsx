'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { selectAuth, clearAuth } from '@/lib/store/authSlice';
import { selectCrypto, setKeypair, setDeviceId, clearCrypto } from '@/lib/store/cryptoSlice';
import { useGetMeQuery, useRegisterDeviceMutation } from '@/lib/store/api';
import {
  bytesToBase64,
  validateMnemonic,
  unwrapPrivateKeyWithMnemonic,
} from '@/lib/crypto/keypair';
import {
  savePrivateKeyLocal,
  loadPrivateKeyLocal,
  saveKeysVersionLocal,
  loadKeysVersionLocal,
  saveDeviceIdLocal,
} from '@/lib/storage/keys';
import { x25519 } from '@noble/curves/ed25519';
import { DeviceType } from '@kairos/types';
import { KairosLogo } from './KairosLogo';

/**
 * Gates every signed-in page behind a vault check: the local private key must
 * exist, match the account's public key, and have been verified against the
 * account's current keysVersion. If the recovery phrase was regenerated on
 * another device (version bump) or the key is missing, the session stays
 * signed in but everything is replaced by an unlock prompt.
 */
export function VaultGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { accessToken } = useSelector(selectAuth);
  const { privateKey } = useSelector(selectCrypto);
  const [registerDevice] = useRegisterDeviceMutation();

  const { data: me, error } = useGetMeQuery(undefined, {
    skip: !accessToken,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [unlockedAt, setUnlockedAt] = useState(0); // bump to re-evaluate after unlock

  // Session token rejected — drop to the login page
  useEffect(() => {
    const status = (error as { status?: number } | undefined)?.status;
    if (status === 401) {
      dispatch(clearAuth());
      dispatch(clearCrypto());
      router.replace('/login');
    }
  }, [error, dispatch, router]);

  // Account exists but never finished the key ceremony — finish it on the login page
  useEffect(() => {
    if (me && !me.publicKey) router.replace('/login');
  }, [me, router]);

  const locked = useMemo(() => {
    void unlockedAt;
    if (!me?.publicKey) return false; // still loading (or redirecting) — handled above
    const localKey = privateKey ?? loadPrivateKeyLocal();
    if (!localKey) return true;
    if (bytesToBase64(x25519.getPublicKey(localKey)) !== me.publicKey) return true;
    if (loadKeysVersionLocal() !== me.keysVersion) return true;
    return false;
  }, [me, privateKey, unlockedAt]);

  if (!locked) return <>{children}</>;

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.mnemonicEncryptedPrivateKey || !me.publicKey) return;
    setBusy(true);
    setUnlockError('');
    try {
      if (!validateMnemonic(phrase)) {
        setUnlockError('That is not a valid 12-word recovery phrase.');
        setBusy(false);
        return;
      }
      const key = await unwrapPrivateKeyWithMnemonic(me.mnemonicEncryptedPrivateKey, phrase);
      const publicKey = x25519.getPublicKey(key);
      if (bytesToBase64(publicKey) !== me.publicKey) {
        setUnlockError('That phrase does not match this account.');
        setBusy(false);
        return;
      }
      savePrivateKeyLocal(key);
      saveKeysVersionLocal(me.keysVersion);
      dispatch(setKeypair({ privateKey: key, publicKey }));
      const device = await registerDevice({
        publicKey: bytesToBase64(publicKey),
        type: DeviceType.web,
        label: `Web — ${navigator.userAgent.slice(0, 40)}`,
      }).unwrap();
      saveDeviceIdLocal(device.deviceId);
      dispatch(setDeviceId(device.deviceId));
      setPhrase('');
      setUnlockedAt(Date.now());
    } catch {
      setUnlockError('That phrase does not match this account.');
    } finally {
      setBusy(false);
    }
  }

  function handleSignOut() {
    sessionStorage.clear();
    dispatch(clearAuth());
    dispatch(clearCrypto());
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8">
          <KairosLogo size={32} />
          <span className="text-gray-900 dark:text-white font-semibold text-lg tracking-tight">kairos</span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Vault locked</h1>
              <p className="text-xs text-gray-500">{me?.email}</p>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            This device no longer holds a valid encryption key — the recovery phrase may have been
            regenerated on another device. Enter your current 12-word phrase to unlock. It never
            leaves this device.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              rows={3}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm font-mono placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors resize-none"
              placeholder="correct horse battery staple …"
              autoFocus
              required
            />
            {unlockError && (
              <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {unlockError}
              </div>
            )}
            <button
              type="submit"
              disabled={busy || !phrase.trim() || !me}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {busy ? 'Unlocking…' : 'Unlock vault'}
            </button>
          </form>

          <button
            onClick={handleSignOut}
            className="w-full mt-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2 text-xs transition-colors"
          >
            Sign out instead
          </button>
        </div>
      </div>
    </div>
  );
}
