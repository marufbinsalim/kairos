'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { AppShell } from '@/components/AppShell';
import { selectCrypto } from '@/lib/store/cryptoSlice';
import { selectAuth } from '@/lib/store/authSlice';
import { useChangePasswordMutation, useUpdateMnemonicMutation } from '@/lib/store/api';
import {
  encryptPrivateKeyWithPassword,
  decryptPrivateKeyWithPassword,
  generateRecoveryMnemonic,
  wrapPrivateKeyWithMnemonic,
  base64ToBytes,
} from '@/lib/crypto/keypair';

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changePassword] = useChangePasswordMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const stored = sessionStorage.getItem('kairos_privkey');
      if (!stored) throw new Error('Private key not found — please re-login.');
      const rawPrivateKey = base64ToBytes(stored);

      const newEncryptedPrivateKey = await encryptPrivateKeyWithPassword(rawPrivateKey, newPassword);

      // Verify round-trip before committing to the server
      const verify = await decryptPrivateKeyWithPassword(newEncryptedPrivateKey, newPassword);
      if (verify.length !== rawPrivateKey.length || !verify.every((b, i) => b === rawPrivateKey[i])) {
        throw new Error('Key encryption verification failed');
      }

      await changePassword({ currentPassword, newPassword, newEncryptedPrivateKey }).unwrap();
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        setError('Current password is incorrect.');
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change password</h2>
          <p className="text-xs text-gray-500">Your private key will be re-encrypted with the new password.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3.5 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
            placeholder="••••••••"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3.5 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
            placeholder="Min. 8 characters"
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3.5 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Password changed successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

function RegenerateMnemonicSection() {
  const { privateKey } = useSelector(selectCrypto);
  const [phase, setPhase] = useState<'idle' | 'confirm' | 'show'>('idle');
  const [newMnemonic, setNewMnemonic] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [updateMnemonic] = useUpdateMnemonicMutation();

  function handleGenerate() {
    const phrase = generateRecoveryMnemonic();
    setNewMnemonic(phrase);
    setConfirmed(false);
    setCopied(false);
    setError('');
    setSuccess(false);
    setPhase('show');
  }

  function handleCopy() {
    navigator.clipboard.writeText(newMnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([newMnemonic], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kairos-recovery-phrase.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    if (!confirmed) return;
    setLoading(true);
    setError('');
    try {
      let rawPrivateKey: Uint8Array;
      if (privateKey) {
        rawPrivateKey = privateKey instanceof Uint8Array ? privateKey : new Uint8Array(Object.values(privateKey as Record<string, number>));
      } else {
        const stored = sessionStorage.getItem('kairos_privkey');
        if (!stored) throw new Error('no_key');
        rawPrivateKey = base64ToBytes(stored);
      }

      const mnemonicEncryptedPrivateKey = await wrapPrivateKeyWithMnemonic(rawPrivateKey, newMnemonic);
      await updateMnemonic({ mnemonicEncryptedPrivateKey }).unwrap();
      setSuccess(true);
      setPhase('idle');
      setNewMnemonic('');
    } catch {
      setError('Failed to save recovery phrase. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const words = newMnemonic.split(' ').filter(Boolean);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recovery phrase</h2>
          <p className="text-xs text-gray-500">Generate a new 12-word phrase to replace your current one.</p>
        </div>
      </div>

      {phase === 'idle' && (
        <>
          {success && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-4">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Recovery phrase updated successfully.
            </div>
          )}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-5">
            <p className="text-amber-300/90 text-xs leading-relaxed">
              Generating a new phrase will <strong>invalidate your old one</strong>. Save the new phrase immediately — if you lose it and forget your password, your account is unrecoverable.
            </p>
          </div>
          <button
            onClick={() => setPhase('confirm')}
            className="bg-amber-600/80 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Generate new recovery phrase
          </button>
        </>
      )}

      {phase === 'confirm' && (
        <div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-5">
            <p className="text-red-300/90 text-sm leading-relaxed">
              Your current recovery phrase will be <strong>permanently replaced</strong>. Make sure you no longer need it before continuing.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setPhase('idle')}
              className="px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Yes, generate new phrase
            </button>
          </div>
        </div>
      )}

      {phase === 'show' && (
        <div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {words.map((word, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                <span className="text-gray-500 text-xs w-5 text-right flex-shrink-0">{i + 1}.</span>
                <span className="text-gray-900 dark:text-white text-sm font-mono">{word}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-5">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg><span className="text-green-400">Copied</span></>
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
              I have saved the new recovery phrase and understand my old phrase no longer works.
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setPhase('idle'); setNewMnemonic(''); }}
              disabled={loading}
              className="px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!confirmed || loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {loading ? 'Saving...' : 'Save new phrase'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  const { email } = useSelector(selectAuth);

  return (
    <AppShell>
      <div className="px-4 sm:px-8 py-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Account</h1>
          <p className="text-gray-500 text-sm mt-0.5">{email}</p>
        </div>

        <div className="space-y-6">
          <ChangePasswordSection />
          <RegenerateMnemonicSection />
        </div>
      </div>
    </AppShell>
  );
}
