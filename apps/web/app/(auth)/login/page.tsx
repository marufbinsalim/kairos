'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useRegisterDeviceMutation } from '@/lib/store/api';
import { setAuth } from '@/lib/store/authSlice';
import { setKeypair, setDeviceId } from '@/lib/store/cryptoSlice';
import { decryptPrivateKeyWithPassword, bytesToBase64 } from '@/lib/crypto/keypair';
import { x25519 } from '@noble/curves/ed25519';
import { DeviceType } from '@kairos/types';
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const [registerDevice] = useRegisterDeviceMutation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    let result: import('@kairos/types').AuthResponse;
    try {
      result = await login({ email, password }).unwrap();
    } catch {
      setError('Invalid email or password');
      return;
    }

    try {
      dispatch(setAuth({ accessToken: result.accessToken, userId: result.userId, email }));

      if (result.encryptedPrivateKey) {
        const privateKey = await decryptPrivateKeyWithPassword(result.encryptedPrivateKey, password);
        const publicKey = x25519.getPublicKey(privateKey);
        sessionStorage.setItem('kairos_privkey', bytesToBase64(privateKey));
        dispatch(setKeypair({ privateKey, publicKey }));

        const webDevice = await registerDevice({
          publicKey: bytesToBase64(publicKey),
          type: DeviceType.web,
          label: `Web — ${navigator.userAgent.slice(0, 40)}`,
        }).unwrap();
        sessionStorage.setItem('kairos_deviceId', webDevice.deviceId);
        dispatch(setDeviceId(webDevice.deviceId));
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Post-login crypto/setup error:', err);
      setError('Login succeeded but key setup failed. Try clearing site data and logging in again.');
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-indigo-500 dark:text-indigo-400 font-bold">K</span>
            </div>
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

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                placeholder="you@example.com" required autoFocus />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Password</label>
                <Link href="/reset-password" className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                placeholder="••••••••" required />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            <button type="submit" disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-gray-500 text-sm">
          No account?{' '}
          <Link href="/register" className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
