'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useRegisterMutation, useRegisterDeviceMutation } from '@/lib/store/api';
import { setAuth } from '@/lib/store/authSlice';
import { setKeypair, setDeviceId } from '@/lib/store/cryptoSlice';
import {
  generateKeypair,
  bytesToBase64,
  encryptPrivateKeyWithPassword,
  generateRecoveryMnemonic,
  wrapPrivateKeyWithMnemonic,
} from '@/lib/crypto/keypair';
import { DeviceType } from '@kairos/types';
import Link from 'next/link';

type Step = 'credentials' | 'mnemonic';

function MnemonicWord({ index, word }: { index: number; word: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
      <span className="text-gray-500 text-xs w-5 text-right flex-shrink-0">{index + 1}.</span>
      <span className="text-white text-sm font-mono">{word}</span>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();
  const [register] = useRegisterMutation();
  const [registerDevice] = useRegisterDeviceMutation();

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    const phrase = generateRecoveryMnemonic();
    setMnemonic(phrase);
    setStep('mnemonic');
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

  async function handleFinalSubmit() {
    if (!confirmed) return;
    setError('');
    setIsLoading(true);
    try {
      const { privateKey, publicKey } = generateKeypair();
      const [encryptedPrivateKey, mnemonicEncryptedPrivateKey] = await Promise.all([
        encryptPrivateKeyWithPassword(privateKey, password),
        wrapPrivateKeyWithMnemonic(privateKey, mnemonic),
      ]);

      const auth = await register({
        email,
        password,
        encryptedPrivateKey,
        mnemonicEncryptedPrivateKey,
        publicKey: bytesToBase64(publicKey),
      }).unwrap();

      dispatch(setAuth({ accessToken: auth.accessToken, userId: auth.userId, email }));
      sessionStorage.setItem('kairos_privkey', bytesToBase64(privateKey));
      dispatch(setKeypair({ privateKey, publicKey }));

      const device = await registerDevice({
        publicKey: bytesToBase64(publicKey),
        type: DeviceType.web,
        label: `Web — ${navigator.userAgent.slice(0, 40)}`,
      }).unwrap();
      dispatch(setDeviceId(device.deviceId));

      router.push('/dashboard');
    } catch {
      setError('Registration failed. Email may already be in use.');
      setStep('credentials');
    } finally {
      setIsLoading(false);
    }
  }

  const words = mnemonic.split(' ');

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <span className="text-indigo-400 font-bold">K</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">kairos</span>
        </div>

        {step === 'credentials' ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-xl font-semibold text-white mb-1">Create account</h1>
            <p className="text-gray-400 text-sm mb-6">
              Your encryption keys are generated locally and never leave your device unencrypted.
            </p>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
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

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors mt-2"
              >
                Continue
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Save your recovery phrase</h1>
                <p className="text-xs text-amber-400/80">Required — read carefully</p>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-5">
              <p className="text-amber-300/90 text-xs leading-relaxed">
                This 12-word phrase is the <strong>only way</strong> to recover your account if you forget your password.
                We cannot recover it for you. If you lose both your password and this phrase, <strong>your data is permanently inaccessible.</strong>
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
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500/50 flex-shrink-0"
              />
              <span className="text-gray-400 text-xs leading-relaxed">
                I have saved my recovery phrase in a safe place and understand that losing it means losing access to my account if I forget my password.
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
                onClick={() => setStep('credentials')}
                disabled={isLoading}
                className="px-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={!confirmed || isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Setting up...
                  </span>
                ) : 'Create account'}
              </button>
            </div>
          </div>
        )}

        <p className="mt-5 text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
