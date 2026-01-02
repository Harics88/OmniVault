import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, FileText, Search, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { notesApi } from '../lib/api';
import type { Note, CreateNote, UpdateNote } from '../types';

export default function Notes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Fetch all notes
    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['notes', searchQuery],
        queryFn: () => notesApi.getAll(searchQuery || undefined),
    });

    // Fetch single note if ID provided
    const { data: selectedNote } = useQuery({
        queryKey: ['notes', id],
        queryFn: () => (id ? notesApi.getById(parseInt(id)) : null),
        enabled: !!id,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (note: CreateNote) => notesApi.create(note),
        onSuccess: (newNote) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            navigate(`/notes/${newNote.id}`);
            setIsCreating(false);
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: number; updates: UpdateNote }) =>
            notesApi.update(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => notesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            navigate('/notes');
        },
    });

    const handleCreateNote = () => {
        createMutation.mutate({ title: 'Untitled Note', content: '' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    return (
        <div className="h-full flex animate-fade-in">
            {/* Notes List Sidebar */}
            <div className="w-80 bg-background-card border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <FileText size={20} className="text-accent-blue" />
                            Notes
                        </h1>
                        <button
                            onClick={handleCreateNote}
                            disabled={createMutation.isPending}
                            className="p-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-lg transition-colors"
                        >
                            {createMutation.isPending ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Plus size={18} />
                            )}
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search notes..."
                            className="input pl-9 py-2 text-sm"
                        />
                    </div>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {notes.length > 0 ? (
                        <div className="space-y-1">
                            {notes.map((note) => (
                                <button
                                    key={note.id}
                                    onClick={() => navigate(`/notes/${note.id}`)}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${id === String(note.id)
                                            ? 'bg-accent-blue/10 border-l-2 border-accent-blue'
                                            : 'hover:bg-background-hover border-l-2 border-transparent'
                                        }`}
                                >
                                    <h3 className="font-medium text-text-primary truncate">{note.title}</h3>
                                    <p className="text-xs text-text-muted mt-1">
                                        {format(new Date(note.updated_at), 'MMM d, h:mm a')}
                                    </p>
                                    {note.content && (
                                        <p className="text-xs text-text-muted mt-1 line-clamp-2">
                                            {note.content.slice(0, 100)}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-text-muted">
                            <FileText size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notes found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Note Editor */}
            <div className="flex-1 flex flex-col">
                {selectedNote ? (
                    <NoteEditor
                        note={selectedNote}
                        onUpdate={(updates) =>
                            updateMutation.mutate({ id: selectedNote.id, updates })
                        }
                        onDelete={() => deleteMutation.mutate(selectedNote.id)}
                        isUpdating={updateMutation.isPending}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-text-muted">
                        <div className="text-center">
                            <FileText size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="mb-4">Select a note or create a new one</p>
                            <button onClick={handleCreateNote} className="btn btn-primary">
                                <Plus size={18} />
                                New Note
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Note Editor Component
function NoteEditor({
    note,
    onUpdate,
    onDelete,
    isUpdating,
}: {
    note: Note;
    onUpdate: (updates: UpdateNote) => void;
    onDelete: () => void;
    isUpdating: boolean;
}) {
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const navigate = useNavigate();

    // Auto-save on blur
    const handleTitleBlur = () => {
        if (title !== note.title) {
            onUpdate({ title });
        }
    };

    const handleContentBlur = () => {
        if (content !== note.content) {
            onUpdate({ content });
        }
    };

    // Update local state when note changes
    useState(() => {
        setTitle(note.title);
        setContent(note.content);
    });

    return (
        <>
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border">
                <button
                    onClick={() => navigate('/notes')}
                    className="p-2 hover:bg-background-hover rounded-lg transition-colors md:hidden"
                >
                    <ArrowLeft size={20} className="text-text-muted" />
                </button>

                <div className="flex items-center gap-2 text-sm text-text-muted">
                    {isUpdating && (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Saving...</span>
                        </>
                    )}
                    <span>Updated {format(new Date(note.updated_at), 'MMM d, h:mm a')}</span>
                </div>

                <button
                    onClick={onDelete}
                    className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            </header>

            {/* Editor */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-3xl mx-auto">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        placeholder="Untitled"
                        className="w-full text-3xl font-bold text-text-primary bg-transparent border-none focus:outline-none mb-6"
                    />

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={handleContentBlur}
                        placeholder="Start writing..."
                        className="w-full min-h-[calc(100vh-300px)] bg-transparent text-text-primary text-base leading-relaxed resize-none focus:outline-none"
                    />
                </div>
            </div>
        </>
    );
}
