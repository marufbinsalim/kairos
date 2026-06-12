'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useListDevicesQuery, useListPendingDevicesQuery,
  useCompleteApprovalMutation, useRevokeDeviceMutation,
} from '@/lib/store/api';
import { selectCrypto } from '@/lib/store/cryptoSlice';
import { selectAuth } from '@/lib/store/authSlice';
import { wrapDEKForDevice, selfUnwrapDEK } from '@/lib/crypto/dek';
import { base64ToBytes, bytesToBase64 } from '@/lib/crypto/keypair';
import { AppShell } from '@/components/AppShell';
import type { Device } from '@kairos/types';

const API = process.env.NEXT_PUBLIC_API_URL;

function DeviceIcon({ type }: { type: string }) {
  if (type === 'cli') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
    </svg>
  );
}

function ApproveModal({ device, onClose }: { device: Device; onClose: () => void }) {
  const { privateKey, publicKey, deviceId } = useSelector(selectCrypto);
  const { accessToken } = useSelector(selectAuth);
  const [completeApproval] = useCompleteApprovalMutation();
  const [revokeDevice] = useRevokeDeviceMutation();
  const [loading, setLoading] = useState(false);
  const [denying, setDenying] = useState(false);
  const [error, setError] = useState('');

  const requestedEnvs = device.requestedEnvInfo ?? [];

  async function handleApprove() {
    if (!privateKey || !publicKey) { setError('Private key not loaded — re-login first.'); return; }
    if (!deviceId) { setError('Device ID missing — re-login first.'); return; }
    if (!requestedEnvs.length) { setError('No environments requested by this device.'); return; }
    setLoading(true);
    setError('');
    try {
      const environments: Array<{ environmentId: string; wrappedDEK: string; wrappedByPublicKey: string }> = [];
      for (const env of requestedEnvs) {
        const syncRes = await fetch(`${API}/api/sync/${env.id}?deviceId=${deviceId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!syncRes.ok) throw new Error(`Failed to load key for "${env.name}"`);
        const { wrappedDEK: selfWrapped } = await syncRes.json();
        const dek = await selfUnwrapDEK(privateKey, selfWrapped);
        const wrappedDEK = await wrapDEKForDevice(privateKey, base64ToBytes(device.publicKey), dek);
        environments.push({
          environmentId: env.id,
          wrappedDEK,
          wrappedByPublicKey: bytesToBase64(publicKey),
        });
      }
      await completeApproval({ deviceId: device.id, environments }).unwrap();
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Approval failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (!loading && e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-400">
            <DeviceIcon type={device.type} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Approve Device</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">{device.label ?? device.type}</p>
          </div>
        </div>

        {requestedEnvs.length > 0 ? (
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              Requested environments ({requestedEnvs.length})
            </p>
            <div className="space-y-1.5">
              {requestedEnvs.map((env) => (
                <div key={env.id} className="flex items-center gap-2.5 bg-gray-100/60 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-700/60 rounded-lg px-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{env.name}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-2.5">
              Approving grants access to encrypt/decrypt secrets in these environments.
            </p>
          </div>
        ) : (
          <div className="mb-5 p-3 bg-yellow-950/30 border border-yellow-700/40 rounded-lg">
            <p className="text-yellow-400 text-sm">This device did not request any specific environments.</p>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={async () => {
              setDenying(true);
              try { await revokeDevice(device.id).unwrap(); } catch { /* ignore */ }
              setDenying(false);
              onClose();
            }}
            disabled={loading || denying}
            className="flex-1 bg-gray-100 dark:bg-gray-900 hover:bg-red-950/40 hover:border-red-800/40 border border-transparent disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:text-red-400 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {denying ? 'Denying…' : 'Deny'}
          </button>
          <button
            onClick={handleApprove}
            disabled={loading || requestedEnvs.length === 0}
            className="flex-1 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-black py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Approving…
              </>
            ) : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyDevices() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex items-center justify-center mb-4">
        <svg className="w-5 h-5 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
        </svg>
      </div>
      <h3 className="text-gray-900 dark:text-white font-semibold mb-1">No active devices</h3>
      <p className="text-gray-500 text-sm max-w-xs">Create an environment to activate your web device, or register the CLI.</p>
    </div>
  );
}

export default function DevicesPage() {
  const { deviceId } = useSelector(selectCrypto);
  const { data: activeDevices, isLoading: loadingActive } = useListDevicesQuery();
  const { data: allPending } = useListPendingDevicesQuery(undefined, { pollingInterval: 5000 });
  const [revokeDevice] = useRevokeDeviceMutation();
  const [approvingDevice, setApprovingDevice] = useState<Device | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const otherPending = allPending?.filter((d) => d.id !== deviceId) ?? [];

  async function handleRevoke(id: string) {
    setRevoking(id);
    try { await revokeDevice(id).unwrap(); } finally { setRevoking(null); }
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-8 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Devices</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage trusted devices that can access your secrets</p>
        </div>

        {/* Pending approval */}
        {otherPending.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Pending Approval
                <span className="ml-2 text-yellow-400 font-bold">{otherPending.length}</span>
              </h2>
            </div>
            <div className="space-y-3">
              {otherPending.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-4 bg-yellow-950/20 border border-yellow-700/40 rounded-lg px-5 py-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0 text-yellow-400">
                    <DeviceIcon type={d.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{d.label ?? d.type}</p>
                    <p className="text-gray-500 text-xs mt-0.5 font-mono">{d.publicKey.slice(0, 24)}…</p>
                    {d.requestedEnvInfo && d.requestedEnvInfo.length > 0 && (
                      <p className="text-yellow-500/70 text-xs mt-1">
                        Requesting: {d.requestedEnvInfo.map((e) => e.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setApprovingDevice(d)}
                    className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Review
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active devices */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Active Devices</h2>
          {loadingActive ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-5 py-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/3 bg-gray-100 dark:bg-gray-900 rounded" />
                      <div className="h-3 w-1/4 bg-gray-100 dark:bg-gray-900 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !activeDevices || activeDevices.length === 0 ? (
            <EmptyDevices />
          ) : (
            <div className="space-y-3">
              {activeDevices.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-5 py-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-gray-400">
                    <DeviceIcon type={d.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{d.label ?? d.type}</p>
                      {d.id === deviceId && (
                        <span className="text-xs bg-gray-500/15 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full flex-shrink-0">
                          this device
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mb-1">
                      {d.type} · Added {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {d.environments && d.environments.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {d.environments.map((e) => (
                          <span key={e.id} className="text-xs bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded font-mono">
                            {e.projectName ? `${e.projectName} › ` : ''}{e.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {d.id !== deviceId && (
                    <button
                      onClick={() => handleRevoke(d.id)}
                      disabled={revoking === d.id}
                      className="text-xs text-red-400/70 hover:text-red-400 disabled:opacity-40 transition-colors"
                    >
                      {revoking === d.id ? 'Revoking…' : 'Revoke'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {approvingDevice && (
        <ApproveModal device={approvingDevice} onClose={() => setApprovingDevice(null)} />
      )}
    </AppShell>
  );
}
