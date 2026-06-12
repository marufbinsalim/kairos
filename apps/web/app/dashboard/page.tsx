'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useListProjectsQuery, useCreateProjectMutation, useDeleteProjectMutation, useRenameProjectMutation } from '@/lib/store/api';
import { AppShell } from '@/components/AppShell';
import type { Project } from '@kairos/types';

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6 animate-pulse">
      <div className="h-5 w-1/3 bg-gray-200 dark:bg-gray-900 rounded mb-3" />
      <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-900 rounded mb-2" />
      <div className="h-4 w-1/5 bg-gray-200 dark:bg-gray-900 rounded" />
    </div>
  );
}

function DeleteConfirmModal({ title, description, onConfirm, onClose, loading }: {
  title: string; description: string; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (!loading && e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{description}</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RenameProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [name, setName] = useState(project.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [renameProject] = useRenameProjectMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === project.name) { onClose(); return; }
    setLoading(true);
    setError('');
    try {
      await renameProject({ id: project.id, name: trimmed }).unwrap();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      setError(msg ?? 'Failed to rename project.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rename Project</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Project name</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 rounded-lg px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm outline-none transition-colors" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()}
              className="flex-1 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-black py-2.5 rounded-lg text-sm font-semibold transition-colors">
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectCard({ project, onDelete, onRename }: { project: Project; onDelete: (id: string) => void; onRename: (p: Project) => void }) {
  const router = useRouter();
  return (
    <div className="bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-lg p-6 text-left transition-all group relative">
      <button onClick={() => router.push(`/dashboard/projects/${project.id}`)} className="absolute inset-0 rounded-lg" aria-label={`Open ${project.name}`} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
        </div>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onRename(project); }}
            className="relative z-10 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Rename project">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
            className="relative z-10 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            aria-label="Delete project">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1 truncate">{project.name}</h3>
      <p className="text-gray-500 text-sm">
        Created {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  );
}

function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try { await onCreate(trimmed); onClose(); }
    catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      setError(msg ?? 'Failed to create project.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Project</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Project name</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. my-api"
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 rounded-lg px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm outline-none transition-colors" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()}
              className="flex-1 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-black py-2.5 rounded-lg text-sm font-semibold transition-colors">
              {loading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: projects, isLoading, isError } = useListProjectsQuery();
  const [createProject] = useCreateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);

  async function handleCreate(name: string) { await createProject({ name }).unwrap(); }

  async function handleDelete() {
    if (!deletingId) return;
    setDeleteLoading(true);
    try { await deleteProject(deletingId).unwrap(); setDeletingId(null); }
    finally { setDeleteLoading(false); }
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-8 py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Projects</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your secret vaults</p>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Project
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : isError ? (
          <div className="bg-red-950/40 border border-red-900/60 rounded-lg p-6 text-center">
            <p className="text-red-400 text-sm">Failed to load projects. Please try refreshing.</p>
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-1">No projects yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">Create your first project to start storing encrypted secrets.</p>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={setDeletingId} onRename={setRenamingProject} />
            ))}
          </div>
        )}
      </div>

      {modalOpen && <NewProjectModal onClose={() => setModalOpen(false)} onCreate={handleCreate} />}
      {deletingId && (
        <DeleteConfirmModal
          title="Delete project?"
          description="This will permanently delete the project and all its environments and secrets. This cannot be undone."
          onConfirm={handleDelete}
          onClose={() => setDeletingId(null)}
          loading={deleteLoading}
        />
      )}
      {renamingProject && <RenameProjectModal project={renamingProject} onClose={() => setRenamingProject(null)} />}
    </AppShell>
  );
}
