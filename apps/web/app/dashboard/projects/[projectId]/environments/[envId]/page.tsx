'use client';
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useListSecretsQuery, useUpsertSecretMutation, useDeleteSecretMutation,
  useListEnvironmentsQuery,
} from '@/lib/store/api';
import { selectCrypto, setDEK } from '@/lib/store/cryptoSlice';
import { selectAuth } from '@/lib/store/authSlice';
import { encryptSecret, decryptSecret } from '@/lib/crypto/secrets';
import { selfUnwrapDEK } from '@/lib/crypto/dek';
import { AppShell } from '@/components/AppShell';
import type { Secret } from '@kairos/types';

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── env parser ────────────────────────────────────────────────────────────────

function parseEnv(text: string): Array<{ key: string; value: string }> {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .flatMap((l) => {
      const eq = l.indexOf('=');
      if (eq === -1) return [];
      const key = l.slice(0, eq).trim();
      if (!key) return [];
      let value = l.slice(eq + 1);
      // strip inline comment (unquoted)
      const firstChar = value.trimStart()[0];
      if (firstChar !== '"' && firstChar !== "'") {
        const commentIdx = value.indexOf(' #');
        if (commentIdx !== -1) value = value.slice(0, commentIdx);
      }
      value = value.trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return [{ key, value }];
    });
}

// ─── BulkImportModal ───────────────────────────────────────────────────────────

function BulkImportModal({
  dek,
  envId,
  onClose,
  upsert,
}: {
  dek: Uint8Array;
  envId: string;
  onClose: () => void;
  upsert: (args: { envId: string; key: string; encryptedValue: string; iv: string }) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'paste' | 'file'>('paste');
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<Array<{ key: string; value: string }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleParse() {
    const rows = parseEnv(text);
    if (!rows.length) { setError('No valid KEY=VALUE pairs found.'); return; }
    setError('');
    setParsed(rows);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setText(content);
      const rows = parseEnv(content);
      if (!rows.length) { setError('No valid KEY=VALUE pairs found.'); return; }
      setError('');
      setParsed(rows);
    };
    reader.readAsText(file);
  }

  function removeRow(idx: number) {
    setParsed((prev) => prev ? prev.filter((_, i) => i !== idx) : prev);
  }

  async function handleImport() {
    if (!parsed?.length) return;
    setLoading(true);
    setError('');
    try {
      await Promise.all(
        parsed.map(async ({ key, value }) => {
          const { encryptedValue, iv } = await encryptSecret(dek, value);
          await upsert({ envId, key, encryptedValue, iv });
        }),
      );
      onClose();
    } catch {
      setError('Import failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (!loading && e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-800 shrink-0">
          <h2 className="text-base font-semibold text-white">Bulk Import Secrets</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!parsed ? (
            <>
              {/* Tabs */}
              <div className="flex gap-1 bg-gray-800/60 p-1 rounded-lg mb-4">
                {(['paste', 'file'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(''); }}
                    className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {t === 'paste' ? 'Paste text' : 'Upload file'}
                  </button>
                ))}
              </div>

              {tab === 'paste' ? (
                <>
                  <textarea
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={'DATABASE_URL=postgres://...\nSECRET_KEY=abc123\nAPI_KEY=xyz'}
                    rows={10}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-lg px-3.5 py-3 text-white placeholder-gray-600 text-sm font-mono outline-none transition-colors resize-none"
                  />
                </>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-xl py-12 cursor-pointer transition-colors"
                >
                  <svg className="w-8 h-8 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-gray-400 text-sm font-medium">Click to upload <span className="text-gray-500 font-normal">or drag and drop</span></p>
                  <p className="text-gray-600 text-xs mt-1">.env files only</p>
                  <input ref={fileRef} type="file" accept=".env,text/plain" className="hidden" onChange={handleFile} />
                </div>
              )}

              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-3">
                {parsed.length} secret{parsed.length !== 1 ? 's' : ''} ready to import. Remove any you don't want.
              </p>
              <div className="space-y-1.5">
                {parsed.map((row, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-2">
                    <span className="font-mono text-sm text-indigo-300 w-40 truncate shrink-0">{row.key}</span>
                    <span className="font-mono text-sm text-gray-400 flex-1 truncate">{row.value || <span className="text-gray-600 italic">empty</span>}</span>
                    <button
                      onClick={() => removeRow(i)}
                      className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 shrink-0 flex gap-3">
          {parsed ? (
            <>
              <button
                onClick={() => { setParsed(null); setError(''); }}
                disabled={loading}
                className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={loading || !parsed.length}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                {loading ? 'Importing…' : `Import ${parsed.length} secret${parsed.length !== 1 ? 's' : ''}`}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              {tab === 'paste' && (
                <button
                  onClick={handleParse}
                  disabled={!text.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Parse
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SecretRow ─────────────────────────────────────────────────────────────────

function SecretRow({
  secret,
  dek,
  onDelete,
  onSave,
}: {
  secret: Secret;
  dek: Uint8Array | null;
  onDelete: () => void;
  onSave: (key: string, value: string) => Promise<void>;
}) {
  const [revealed, setRevealed] = useState(false);
  const [value, setValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    if (!dek) return;
    if (revealed) { setRevealed(false); setValue(''); return; }
    const v = await decryptSecret(dek, secret.encryptedValue, secret.iv);
    setValue(v);
    setRevealed(true);
  }

  async function handleCopy() {
    if (!dek) return;
    const v = revealed ? value : await decryptSecret(dek, secret.encryptedValue, secret.iv);
    await navigator.clipboard.writeText(v);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); }
  }

  async function startEdit() {
    if (!dek) return;
    const v = await decryptSecret(dek, secret.encryptedValue, secret.iv);
    setEditValue(v);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(secret.key, editValue);
      setEditing(false);
      if (revealed) setValue(editValue);
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setEditValue('');
  }

  if (editing) {
    return (
      <div className="flex items-center gap-3 bg-gray-900 border border-indigo-500/40 rounded-xl px-5 py-3">
        <span className="font-mono text-sm text-indigo-300 w-40 shrink-0 truncate">{secret.key}</span>
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') cancelEdit(); }}
          className="flex-1 bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-white text-sm font-mono outline-none transition-colors"
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={cancelEdit}
            disabled={saving}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            title="Cancel"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-green-400 hover:bg-green-950/30 disabled:opacity-50 transition-colors"
            title="Save"
          >
            {saving ? (
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-5 py-3.5 transition-colors group">
      <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
        <span className="font-mono text-sm text-indigo-300 truncate">{secret.key}</span>
        <span className="font-mono text-sm text-gray-400 truncate">
          {revealed ? value : '••••••••••••'}
        </span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleToggle} disabled={!dek} title={revealed ? 'Hide' : 'Reveal'}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 disabled:opacity-30 transition-colors">
          {revealed ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
        <button onClick={handleCopy} disabled={!dek} title="Copy value"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 disabled:opacity-30 transition-colors">
          {copied ? (
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
            </svg>
          )}
        </button>
        <button onClick={startEdit} disabled={!dek} title="Edit value"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 disabled:opacity-30 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
        <button onClick={handleDelete} disabled={deleting} title="Delete"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/30 disabled:opacity-30 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SecretsPage({ params }: { params: { projectId: string; envId: string } }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { dek, privateKey, deviceId } = useSelector(selectCrypto);
  const { accessToken } = useSelector(selectAuth);
  const { data: secrets, isLoading } = useListSecretsQuery(params.envId);
  const { data: environments } = useListEnvironmentsQuery(params.projectId);
  const [upsertSecret] = useUpsertSecretMutation();
  const [deleteSecret] = useDeleteSecretMutation();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const env = environments?.find((e) => e.id === params.envId);

  useEffect(() => {
    if (!accessToken) { router.push('/login'); return; }
    if (dek || !privateKey || !deviceId || !accessToken) return;
    setSyncing(true);
    fetch(`${API}/api/sync/${params.envId}?deviceId=${deviceId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.wrappedDEK) {
          const loaded = await selfUnwrapDEK(privateKey, data.wrappedDEK);
          dispatch(setDEK(loaded));
        }
      })
      .catch(() => {})
      .finally(() => setSyncing(false));
  }, [dek, privateKey, deviceId, accessToken, params.envId, dispatch, router]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!dek) return;
    const { encryptedValue, iv } = await encryptSecret(dek, newValue);
    await upsertSecret({ envId: params.envId, key: newKey, encryptedValue, iv }).unwrap();
    setNewKey('');
    setNewValue('');
  }

  async function handleSave(key: string, value: string) {
    if (!dek) return;
    const { encryptedValue, iv } = await encryptSecret(dek, value);
    await upsertSecret({ envId: params.envId, key, encryptedValue, iv }).unwrap();
  }

  async function handleBulkUpsert(args: { envId: string; key: string; encryptedValue: string; iv: string }) {
    await upsertSecret(args).unwrap();
  }

  if (!accessToken) return null;

  const dekReady = !!dek;

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 transition-colors">Projects</Link>
          <svg className="w-3.5 h-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <Link href={`/dashboard/projects/${params.projectId}`} className="text-gray-500 hover:text-gray-300 transition-colors">
            {env?.projectName ?? 'Project'}
          </Link>
          <svg className="w-3.5 h-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-gray-300 font-medium">{env?.name ?? 'Environment'}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Secrets</h1>
            <p className="text-gray-500 text-sm mt-0.5">End-to-end encrypted key-value pairs</p>
          </div>
          <button
            onClick={() => setBulkOpen(true)}
            disabled={!dekReady}
            title={!dekReady ? 'Encryption key not loaded' : undefined}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-700 text-gray-200 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Import .env
          </button>
        </div>

        {/* Status banners */}
        {syncing && (
          <div className="mb-5 flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
            <svg className="animate-spin w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-gray-400 text-sm">Loading encryption key…</span>
          </div>
        )}
        {!dekReady && !syncing && !privateKey && (
          <div className="mb-5 flex items-start gap-3 bg-yellow-950/20 border border-yellow-700/40 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-yellow-400/80 text-sm">
              Private key not loaded.{' '}
              <Link href="/login" className="underline hover:text-yellow-300">Re-login</Link>{' '}
              to access secrets.
            </p>
          </div>
        )}
        {!dekReady && !syncing && privateKey && (
          <div className="mb-5 flex items-start gap-3 bg-orange-950/20 border border-orange-700/40 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-orange-400/80 text-sm">
              No encryption key found for this environment on your device. Request access from another active device.
            </p>
          </div>
        )}

        {/* Add secret form */}
        <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Add Secret</p>
          <div className="flex gap-3">
            <input
              placeholder="KEY"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              className="w-40 bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-white placeholder-gray-600 text-sm font-mono outline-none transition-colors"
              required
            />
            <input
              placeholder="value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              type="password"
              className="flex-1 bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-white placeholder-gray-600 text-sm outline-none transition-colors"
              required
            />
            <button
              type="submit"
              disabled={!dekReady || !newKey || !newValue}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add
            </button>
          </div>
        </form>

        {/* Secrets table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !secrets || secrets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-gray-800 rounded-xl">
            <svg className="w-8 h-8 text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            <p className="text-gray-500 text-sm">No secrets yet. Add one above or import a .env file.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 px-5 mb-2">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Key</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Value</span>
              </div>
              <div className="w-[116px]" />
            </div>
            <div className="space-y-2">
              {secrets.map((secret) => (
                <SecretRow
                  key={secret.id}
                  secret={secret}
                  dek={dek}
                  onDelete={() => deleteSecret({ envId: params.envId, key: secret.key }).unwrap()}
                  onSave={handleSave}
                />
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-4 text-right">{secrets.length} secret{secrets.length !== 1 ? 's' : ''}</p>
          </>
        )}
      </div>

      {bulkOpen && dek && (
        <BulkImportModal
          dek={dek}
          envId={params.envId}
          onClose={() => setBulkOpen(false)}
          upsert={handleBulkUpsert}
        />
      )}
    </AppShell>
  );
}
