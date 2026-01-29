import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Trash2, RotateCcw, Loader2, CheckSquare, Square, XCircle } from 'lucide-react';
import { notesApi } from '../lib/api';
import type { Note } from '../types';
import ConfirmModal from '../components/ConfirmModal';

export default function RecycleBin() {
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'single' | 'bulk' | 'empty'>('single');
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

    // Fetch deleted notes
    const { data: deletedNotes = [], isLoading } = useQuery({
        queryKey: ['deleted-notes'],
        queryFn: () => notesApi.getDeleted(),
        refetchOnWindowFocus: true,
        refetchOnMount: 'always',
        staleTime: 0,
    });

    // Mutations
    const restoreMutation = useMutation({
        mutationFn: (id: number) => notesApi.restore(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deleted-notes'] });
            queryClient.invalidateQueries({ queryKey: ['notes-tree'] });
        },
    });

    const restoreBulkMutation = useMutation({
        mutationFn: (ids: number[]) => notesApi.restoreBulk(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deleted-notes'] });
            queryClient.invalidateQueries({ queryKey: ['notes-tree'] });
            setSelectedIds(new Set());
        },
    });

    const permanentDeleteMutation = useMutation({
        mutationFn: (id: number) => notesApi.permanentDelete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deleted-notes'] });
            setShowDeleteConfirm(false);
            setNoteToDelete(null);
        },
    });

    const deleteBulkMutation = useMutation({
        mutationFn: (ids: number[]) => notesApi.deleteBulk(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deleted-notes'] });
            setShowDeleteConfirm(false);
            setSelectedIds(new Set());
        },
    });

    const emptyMutation = useMutation({
        mutationFn: () => notesApi.emptyRecycleBin(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deleted-notes'] });
            setShowDeleteConfirm(false);
            setSelectedIds(new Set());
        },
    });

    // Handlers
    const toggleSelect = (id: number) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === deletedNotes.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(deletedNotes.map(n => n.id)));
    };

    const handleEmptyRecycleBin = () => {
        setConfirmAction('empty');
        setShowDeleteConfirm(true);
    };

    const handleBulkDelete = () => {
        setConfirmAction('bulk');
        setShowDeleteConfirm(true);
    };

    const handleBulkRestore = () => {
        restoreBulkMutation.mutate(Array.from(selectedIds));
    };

    const confirmDelete = () => {
        if (confirmAction === 'empty') emptyMutation.mutate();
        else if (confirmAction === 'bulk') deleteBulkMutation.mutate(Array.from(selectedIds));
        else if (noteToDelete) permanentDeleteMutation.mutate(noteToDelete);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-fade-in bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-8 py-5">
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/5 rounded-2xl border border-red-500/20 shadow-lg shadow-red-500/10">
                            <Trash2 size={24} className="text-accent-red" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-text-primary tracking-tight">Recycle Bin</h1>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-[0.1em] opacity-70">
                                {deletedNotes.length} {deletedNotes.length === 1 ? 'item' : 'items'} pending permanent deletion
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {deletedNotes.length > 0 && (
                            <button
                                onClick={handleEmptyRecycleBin}
                                className="group flex items-center gap-2 px-5 py-2.5 bg-accent-red/10 text-accent-red hover:bg-accent-red transition-all duration-300 rounded-xl border border-accent-red/20 hover:border-accent-red shadow-lg hover:shadow-accent-red/20 active:scale-95"
                            >
                                <XCircle size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                                <span className="text-sm font-black tracking-wide group-hover:text-white">Empty Bin</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-accent-blue/10 border-b border-accent-blue/20 px-8 py-3 animate-slide-down">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-accent-blue">
                                {selectedIds.size} items selected
                            </span>
                            <div className="h-4 w-px bg-accent-blue/20" />
                            <button onClick={() => setSelectedIds(new Set())} className="text-sm text-text-muted hover:text-text-primary">
                                Clear selection
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBulkRestore}
                                className="flex items-center gap-2 px-3 py-1.5 bg-accent-green/10 text-accent-green hover:bg-accent-green hover:text-white rounded-md text-sm font-bold transition-all"
                            >
                                <RotateCcw size={14} />
                                Restore
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-3 py-1.5 bg-accent-red/10 text-accent-red hover:bg-accent-red hover:text-white rounded-md text-sm font-bold transition-all"
                            >
                                <Trash2 size={14} />
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                <div className="max-w-5xl mx-auto">
                    {deletedNotes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-accent-red/10 blur-3xl rounded-full scale-150" />
                                <div className="relative w-24 h-24 bg-gradient-to-br from-background-elevated to-background border border-border/50 rounded-3xl flex items-center justify-center shadow-2xl">
                                    <Trash2 size={40} className="text-text-muted opacity-20" />
                                    <div className="absolute -bottom-2 -right-2 bg-accent-green/10 p-2 rounded-xl border border-accent-green/20">
                                        <span className="text-sm">✨</span>
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-text-primary mb-2 tracking-tight">Your bin is pristine</h3>
                            <p className="text-text-secondary max-w-xs mx-auto leading-relaxed">
                                Items you delete from your workspace will appear here for 30 days before permanent removal.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-background-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                            {/* Table Header */}
                            <div className="flex items-center px-4 py-3 bg-background-elevated/50 border-b border-border text-[10px] font-black text-text-muted uppercase tracking-widest">
                                <div className="w-10 flex justify-center">
                                    <button onClick={toggleSelectAll} className="p-1 hover:bg-background-hover rounded">
                                        {selectedIds.size === deletedNotes.length ? <CheckSquare size={16} className="text-accent-blue" /> : <Square size={16} />}
                                    </button>
                                </div>
                                <div className="flex-1 pl-4">Note Title</div>
                                <div className="w-48">Deleted On</div>
                                <div className="w-32 text-right">Actions</div>
                            </div>

                            {/* List Items */}
                            <div className="divide-y divide-border/50">
                                {deletedNotes.map((note: Note) => (
                                    <div
                                        key={note.id}
                                        onClick={() => toggleSelect(note.id)}
                                        className={`flex items-center px-4 py-2 hover:bg-background-elevated/30 transition-colors group cursor-pointer ${selectedIds.has(note.id) ? 'bg-accent-blue/5' : ''}`}
                                    >
                                        <div className="w-10 flex justify-center" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => toggleSelect(note.id)} className="p-1 rounded transition-colors group-hover:bg-background-hover">
                                                {selectedIds.has(note.id) ? <CheckSquare size={16} className="text-accent-blue" /> : <Square size={16} className="opacity-30 group-hover:opacity-100" />}
                                            </button>
                                        </div>
                                        <div className="flex-1 pl-4 flex items-center gap-3">
                                            <span className="text-xl">{note.icon || '📄'}</span>
                                            <div>
                                                <h3 className="text-sm font-semibold text-text-primary">{note.title || 'Untitled'}</h3>
                                                {note.content && (
                                                    <p className="text-[11px] text-text-muted truncate max-w-md opacity-60">
                                                        {note.content.replace(/<[^>]*>/g, '').substring(0, 100)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-48 text-xs text-text-muted font-medium">
                                            {note.deleted_at ? format(new Date(note.deleted_at), 'MMM d, h:mm a') : 'Recently'}
                                        </div>
                                        <div className="w-32 flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); restoreMutation.mutate(note.id); }}
                                                className="p-1.5 text-accent-green hover:bg-accent-green/10 rounded-md transition-all"
                                                title="Restore"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); setConfirmAction('single'); setShowDeleteConfirm(true); }}
                                                className="p-1.5 text-accent-red hover:bg-accent-red/10 rounded-md transition-all"
                                                title="Delete permanently"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setNoteToDelete(null);
                }}
                onConfirm={confirmDelete}
                title={confirmAction === 'empty' ? 'Empty Recycle Bin?' : 'Permanently Delete?'}
                message={confirmAction === 'empty'
                    ? "This will permanently remove ALL items from the recycle bin. This action cannot be undone."
                    : confirmAction === 'bulk'
                        ? `Are you sure you want to permanently delete these ${selectedIds.size} items?`
                        : "Are you sure you want to permanently delete this item? This action cannot be undone."}
            />
        </div>
    );
}
