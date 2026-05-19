'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '@/lib/store/api';
import { setAuth } from '@/lib/store/authSlice';
import { setKeypair, setDeviceId } from '@/lib/store/cryptoSlice';
import { decryptPrivateKeyWithPassword, bytesToBase64 } from '@/lib/crypto/keypair';
import { x25519 } from '@noble/curves/ed25519';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;
async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}/api${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setAuth({ accessToken: result.accessToken, userId: result.userId, email }));

      if (result.encryptedPrivateKey) {
        const privateKey = await decryptPrivateKeyWithPassword(result.encryptedPrivateKey, password);
        const publicKey = x25519.getPublicKey(privateKey);
        sessionStorage.setItem('kairos_privkey', bytesToBase64(privateKey));
        dispatch(setKeypair({ privateKey, publicKey }));

        const devices = await apiFetch<Array<{ id: string; status: string }>>('/devices', result.accessToken);
        const device = devices.find((d) => d.status === 'active') ?? devices.find((d) => d.status === 'pending');
        if (device) dispatch(setDeviceId(device.id));
      }

      router.push('/dashboard');
    } catch {
      setError('Invalid email or password');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <span className="text-indigo-400 font-bold">K</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">kairos</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                placeholder="you@example.com" required autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                placeholder="••••••••" required />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
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
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
