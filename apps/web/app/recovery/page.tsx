'use client';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useInitiateRecoveryMutation, useRegisterDeviceMutation, useCompleteRecoveryMutation } from '@/lib/store/api';
import { setKeypair, setDEK, setDeviceId } from '@/lib/store/cryptoSlice';
import { generateKeypair, bytesToBase64 } from '@/lib/crypto/keypair';
import { selfWrapDEK } from '@/lib/crypto/dek';
import { mnemonicToRecoveryKey, unwrapDEKWithRecoveryKey } from '@/lib/crypto/recovery';
import { storePrivateKey } from '@/lib/storage/indexeddb';
import { DeviceType } from '@kairos/types';

export default function RecoveryPage() {
  const [environmentId, setEnvironmentId] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const [initiateRecovery] = useInitiateRecoveryMutation();
  const [registerDevice] = useRegisterDeviceMutation();
  const [completeRecovery] = useCompleteRecoveryMutation();

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const recoveryKey = mnemonicToRecoveryKey(mnemonic.trim());
      const { wrappedDEKRecovery } = await initiateRecovery({ environmentId }).unwrap();
      const dek = await unwrapDEKWithRecoveryKey(recoveryKey, wrappedDEKRecovery);

      const { privateKey, publicKey } = generateKeypair();
      await storePrivateKey(privateKey, newPassword);

      const deviceResult = await registerDevice({
        publicKey: bytesToBase64(publicKey),
        type: DeviceType.recovery_device,
        label: 'Recovery Device',
      }).unwrap();

      const wrappedDEK = await selfWrapDEK(privateKey, dek);
      await completeRecovery({ deviceId: deviceResult.deviceId, environmentId, wrappedDEK }).unwrap();

      dispatch(setKeypair({ privateKey, publicKey }));
      dispatch(setDEK(dek));
      dispatch(setDeviceId(deviceResult.deviceId));
      setDone(true);
    } catch {
      setError('Recovery failed. Check your recovery key and environment ID.');
    } finally {
      setIsLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-4 text-green-400">Recovery Complete</h1>
          <p className="text-gray-400 mb-6">Your account has been recovered. Re-register the CLI if needed.</p>
          <button onClick={() => router.push('/dashboard')} className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg font-medium">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-6">Recover Account</h1>
        <form onSubmit={handleRecover} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Environment ID</label>
            <input value={environmentId} onChange={(e) => setEnvironmentId(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white border border-gray-700 focus:outline-none focus:border-indigo-500 font-mono text-sm" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Recovery Mnemonic (24 words)</label>
            <textarea value={mnemonic} onChange={(e) => setMnemonic(e.target.value)} rows={4}
              className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white border border-gray-700 focus:outline-none focus:border-indigo-500 font-mono text-sm resize-none" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white border border-gray-700 focus:outline-none focus:border-indigo-500" required minLength={8} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg font-medium disabled:opacity-50">
            {isLoading ? 'Recovering...' : 'Recover Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
