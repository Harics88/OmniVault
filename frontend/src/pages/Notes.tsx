import { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Plus, Search, Loader2, Trash2, ArrowLeft, Check, Pin, Edit3, ChevronDown,
    Folder, FolderOpen, FolderPlus, MoreHorizontal, ChevronRight, ChevronLeft, FileText
} from 'lucide-react';
import { notesApi, sectionsApi } from '../lib/api';
import type { Note, NoteSection, NoteTreeItem, NoteBreadcrumb, CreateNote, UpdateNote } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import RichTextEditor from '../components/RichTextEditor';
import Breadcrumb from '../components/Breadcrumb';
import Skeleton from '../components/Skeleton';

// Folder colors - 10 options
const FOLDER_COLORS = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Gray', value: '#6B7280' },
];

// Emoji picker for notes - organized by category
const EMOJI_OPTIONS = [
    // Documents & Writing
    '📄', '📝', '📋', '📌', '📎', '📓', '📔', '📕', '📗', '📘', '📙', '📚', '📖', '✏️', '🖊️',
    // Work & Productivity
    '💼', '🎯', '💡', '✅', '⭐', '🏆', '📊', '📈', '📉', '💰', '💵', '🗓️', '⏰', '🔔',
    // Tech & Development
    '💻', '🖥️', '⌨️', '🔧', '⚙️', '🔩', '🔌', '💾', '📡', '🌐', '🔐', '🔑', '🛠️',
    // Creative & Design
    '🎨', '🎭', '🎬', '🎵', '🎹', '📷', '🖼️', '✨', '💫', '🌈',
    // Nature & Weather
    '🌱', '🌿', '🌳', '🌸', '🌺', '🌻', '🍀', '☀️', '🌙', '🌍',
    // Symbols & Shapes
    '❤️', '💜', '💙', '💚', '💛', '🧡', '🖤', '🤍', '❗', '❓', '💯', '🔥', '⚡', '💥',
    // Activities & Travel
    '🚀', '✈️', '🏠', '🏢', '🏫', '🏥', '🏪', '🛒', '🎮', '🎲', '⚽', '🏀',
    // Food & Drink
    '☕', '🍵', '🍔', '🍕', '🍎', '🍊', '🍋', '🍇', '🥗', '🍰',
    // People & Emotions
    '😀', '🤔', '👍', '👎', '👋', '🙏', '💪', '🧠', '👀', '🎉',
];

export default function Notes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
    const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [editingFolder, setEditingFolder] = useState<NoteSection | null>(null);
    const [folderToDelete, setFolderToDelete] = useState<NoteSection | null>(null);
    const [showFolderDeleteConfirm, setShowFolderDeleteConfirm] = useState(false);

    // Fetch notes tree
    const { data: notesTree = [], isLoading, refetch: refetchTree } = useQuery({
        queryKey: ['notes-tree'],
        queryFn: () => notesApi.getTree(),
        staleTime: 0, // Always considered stale for fresh data
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('new') === 'true') {
            handleCreateNote();
            navigate('/notes', { replace: true });
        }
    }, [location.search, navigate]);

    // Fetch single note if ID provided
    const { data: selectedNote } = useQuery({
        queryKey: ['note', id],
        queryFn: () => (id ? notesApi.getById(parseInt(id)) : null),
        enabled: !!id,
    });

    // Fetch breadcrumb for selected note
    const { data: breadcrumb = [] } = useQuery({
        queryKey: ['note-breadcrumb', id],
        queryFn: () => (id ? notesApi.getBreadcrumb(parseInt(id)) : []),
        enabled: !!id,
    });

    // Fetch folders (sections)
    const { data: folders = [] } = useQuery({
        queryKey: ['folders'],
        queryFn: () => sectionsApi.getAll(),
    });

    // Create note mutation
    const createMutation = useMutation({
        mutationFn: (note: CreateNote) => notesApi.create(note),
        onSuccess: (newNote: Note) => {
            // Optimistically populate the note cache so it opens instantly
            queryClient.setQueryData(['note', newNote.id.toString()], newNote);

            // Navigate immediately for fast UX
            navigate(`/notes/${newNote.id}`);

            // Background refreshes - don't await to avoid delaying navigation
            refetchTree();
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            queryClient.invalidateQueries({ queryKey: ['system'] });
        },
    });

    // Update note mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateNote }) =>
            notesApi.update(id, data),
        onSuccess: async () => {
            // Force immediate tree refetch for sidebar updates
            await refetchTree();
            // Invalidate note and folders
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['note'] }),
                queryClient.invalidateQueries({ queryKey: ['notes'] }),
                queryClient.invalidateQueries({ queryKey: ['system'] }),
                queryClient.invalidateQueries({ queryKey: ['note-breadcrumb'] }),
                queryClient.invalidateQueries({ queryKey: ['folders'] }),
            ]);
        },
    });

    // Delete note mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => notesApi.delete(id),
        onMutate: async (deletedId: number) => {
            // Navigate immediately for instant feedback
            navigate('/notes');

            // Cancel any outgoing refetches to prevent overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: ['notes-tree'] });
            await queryClient.cancelQueries({ queryKey: ['folders'] });

            // Snapshot the previous value for rollback
            const previousTree = queryClient.getQueryData(['notes-tree']);

            // Optimistically update the tree by removing the deleted note
            queryClient.setQueryData(['notes-tree'], (oldTree: any) => {
                if (!oldTree) return [];

                const removeNode = (nodes: any[]): any[] => {
                    return nodes
                        .filter(node => node.id !== deletedId)
                        .map(node => ({
                            ...node,
                            children: node.children ? removeNode(node.children) : []
                        }));
                };

                return removeNode(oldTree);
            });

            return { previousTree };
        },
        onError: (_err, _deletedId, context: any) => {
            // Rollback on error
            if (context?.previousTree) {
                queryClient.setQueryData(['notes-tree'], context.previousTree);
            }
        },
        onSettled: () => {
            // Background sync - refetch to ensure consistency
            refetchTree();
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            queryClient.invalidateQueries({ queryKey: ['system'] });
            queryClient.invalidateQueries({ queryKey: ['deleted-notes'] }); // Update recycle bin
        },
    });

    // Folder mutations
    const createFolderMutation = useMutation({
        mutationFn: (folder: { name: string; color: string }) => sectionsApi.create(folder),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            setShowFolderModal(false);
        },
    });

    const updateFolderMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: { name?: string; color?: string } }) =>
            sectionsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            setShowFolderModal(false);
            setEditingFolder(null);
        },
    });

    const deleteFolderMutation = useMutation({
        mutationFn: (id: number) => sectionsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            queryClient.invalidateQueries({ queryKey: ['notes-tree'] });
        },
    });

    // Expand parent notes when navigating to a child
    useEffect(() => {
        if (breadcrumb.length > 0) {
            const newExpanded = new Set(expandedNotes);
            breadcrumb.forEach((item: NoteBreadcrumb) => newExpanded.add(item.id));
            setExpandedNotes(newExpanded);
        }
    }, [breadcrumb]);

    // Expand folder when navigating to a note in a folder
    useEffect(() => {
        if (selectedNote?.section_id) {
            setExpandedFolders((prev: Set<number>) => {
                if (prev.has(selectedNote.section_id!)) return prev;
                const next = new Set(prev);
                next.add(selectedNote.section_id!);
                return next;
            });
        }
    }, [selectedNote?.section_id]);

    // Group notes by folder
    const notesByFolder = notesTree.reduce((acc: Record<number | 'unfiled', NoteTreeItem[]>, note: NoteTreeItem) => {
        // Only root-level notes go in folders
        const folderId = note.section_id ?? 'unfiled';
        if (!acc[folderId]) acc[folderId] = [];
        acc[folderId].push(note);
        return acc;
    }, { unfiled: [] });

    // Handlers
    const handleCreateNote = (parentId?: number, folderId?: number) => {
        // Clear search so the new note is visible in its destination
        setSearchQuery('');

        if (folderId !== undefined) {
            setExpandedFolders((prev: Set<number>) => {
                if (prev.has(folderId)) return prev;
                const next = new Set(prev);
                next.add(folderId);
                return next;
            });
        }
        if (parentId !== undefined) {
            setExpandedNotes((prev: Set<number>) => {
                if (prev.has(parentId)) return prev;
                const next = new Set(prev);
                next.add(parentId);
                return next;
            });
        }

        createMutation.mutate({
            title: 'Untitled',
            content: '',
            icon: '📄',
            parent_id: parentId !== undefined ? parentId : null,
            section_id: folderId !== undefined ? folderId : null,
        });
    };

    const handleSelectNote = (noteId: number) => {
        navigate(`/notes/${noteId}`);
    };

    const handleToggleFolderExpand = (folderId: number) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const handleToggleNoteExpand = (noteId: number) => {
        const newExpanded = new Set(expandedNotes);
        if (newExpanded.has(noteId)) {
            newExpanded.delete(noteId);
        } else {
            newExpanded.add(noteId);
        }
        setExpandedNotes(newExpanded);
    };

    const handleDeleteNote = (noteId: number) => {
        setNoteToDelete(noteId);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (noteToDelete) {
            deleteMutation.mutate(noteToDelete);
        }
        setShowDeleteConfirm(false);
        setNoteToDelete(null);
    };

    const getDeleteMessage = () => {
        const findInTree = (items: NoteTreeItem[], id: number): NoteTreeItem | null => {
            for (const item of items) {
                if (item.id === id) return item;
                if (item.children) {
                    const found = findInTree(item.children, id);
                    if (found) return found;
                }
            }
            return null;
        };
        const note = noteToDelete ? findInTree(notesTree, noteToDelete) : null;
        const hasChildren = note?.children && note.children.length > 0;
        return `Are you sure you want to delete this note${hasChildren ? ' and all its sub-pages' : ''}? This action cannot be undone.`;
    };

    const handleBreadcrumbNavigate = (noteId: number | null) => {
        if (noteId === null) {
            navigate('/notes');
        } else {
            navigate(`/notes/${noteId}`);
        }
    };

    // Filter tree by search
    const filterTree = (items: NoteTreeItem[], query: string): NoteTreeItem[] => {
        if (!query) return items;
        const lowerQuery = query.toLowerCase();

        return items.reduce((acc: NoteTreeItem[], item) => {
            const matchesTitle = item.title.toLowerCase().includes(lowerQuery);
            const filteredChildren = filterTree(item.children, query);

            if (matchesTitle || filteredChildren.length > 0) {
                acc.push({
                    ...item,
                    children: filteredChildren,
                });
            }
            return acc;
        }, []);
    };

    // Render note tree item (recursive)
    const renderNoteItem = (note: NoteTreeItem, level: number = 0) => {
        const hasChildren = note.children && note.children.length > 0;
        const isExpanded = expandedNotes.has(note.id);
        const isSelected = id === note.id.toString();

        return (
            <div key={note.id}>
                <div
                    className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${isSelected
                        ? 'bg-accent-blue/20 text-accent-blue'
                        : 'hover:bg-background-hover text-text-secondary'
                        }`}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={() => handleSelectNote(note.id)}
                >
                    {/* Expand/Collapse */}
                    <button
                        className={`p-0.5 rounded hover:bg-background-card transition-colors ${hasChildren ? 'visible' : 'invisible'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleNoteExpand(note.id);
                        }}
                    >
                        {isExpanded ? (
                            <ChevronDown size={14} className="text-text-muted" />
                        ) : (
                            <ChevronRight size={14} className="text-text-muted" />
                        )}
                    </button>

                    {/* Icon */}
                    <span className="text-base flex-shrink-0">{note.icon || '📄'}</span>

                    {/* Title */}
                    <span className="flex-1 truncate text-sm">{note.title || 'Untitled'}</span>

                    {/* Pin indicator */}
                    {note.is_pinned && <Pin size={12} className="text-amber-500 flex-shrink-0" />}

                    {/* Quick actions on hover */}
                    <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                            className="p-1 hover:bg-background-card rounded text-text-muted hover:text-accent-blue"
                            onClick={(e: any) => {
                                e.stopPropagation();
                                handleCreateNote(note.id);
                            }}
                            title="Add sub-page"
                        >
                            <Plus size={14} />
                        </button>
                        <button
                            className="p-1 hover:bg-red-500/10 rounded group/del text-text-muted hover:text-red-500"
                            onClick={(e: any) => {
                                e.stopPropagation();
                                handleDeleteNote(note.id);
                            }}
                            title="Delete note"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div>
                        {note.children.map((child) => renderNoteItem(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Render folder
    const renderFolder = (folder: NoteSection) => {
        const isExpanded = expandedFolders.has(folder.id);
        const folderNotes = notesByFolder[folder.id] || [];
        const filteredFolderNotes = searchQuery
            ? filterTree(folderNotes, searchQuery)
            : folderNotes;

        if (searchQuery && filteredFolderNotes.length === 0) return null;

        return (
            <div key={folder.id} className="mb-1">
                {/* Folder Header */}
                <div
                    className="group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-background-hover transition-colors"
                    onClick={() => handleToggleFolderExpand(folder.id)}
                >
                    {/* Folder Icon - changes when open */}
                    {isExpanded ? (
                        <FolderOpen size={18} style={{ color: folder.color }} className="flex-shrink-0" />
                    ) : (
                        <Folder size={18} style={{ color: folder.color }} className="flex-shrink-0" />
                    )}

                    {/* Folder Name */}
                    <span className="flex-1 text-sm font-medium text-text-primary truncate">
                        {folder.name}
                    </span>

                    {/* Note count */}
                    <span className="text-xs text-text-muted">
                        {folderNotes.length}
                    </span>

                    {/* Actions on hover */}
                    <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                            className="p-1 hover:bg-background-card rounded text-text-muted hover:text-accent-blue"
                            onClick={(e: any) => {
                                e.stopPropagation();
                                handleCreateNote(undefined, folder.id);
                            }}
                            title="Add note to folder"
                        >
                            <Plus size={14} />
                        </button>
                        <button
                            className="p-1 hover:bg-red-500/10 rounded text-text-muted hover:text-red-500"
                            onClick={(e: any) => {
                                e.stopPropagation();
                                setFolderToDelete(folder);
                                setShowFolderDeleteConfirm(true);
                            }}
                            title="Delete folder"
                        >
                            <Trash2 size={14} />
                        </button>
                        <button
                            className="p-1 hover:bg-background-card rounded text-text-muted hover:text-text-primary"
                            onClick={(e: any) => {
                                e.stopPropagation();
                                setEditingFolder(folder);
                                setShowFolderModal(true);
                            }}
                            title="Edit folder"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                    </div>
                </div>

                {/* Folder Contents */}
                {isExpanded && (
                    <div className="ml-2 pl-2 border-l border-border/50">
                        {filteredFolderNotes.length > 0 ? (
                            filteredFolderNotes.map((note) => renderNoteItem(note, 0))
                        ) : (
                            <div className="px-3 py-6 text-center">
                                <FileText size={24} className="mx-auto mb-2 text-text-muted opacity-20" />
                                <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Empty folder</p>
                                <p className="text-[9px] text-text-muted/60 mt-1">Add a note or subfolder to get started</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <aside className={`${isSidebarCollapsed ? 'w-0' : 'w-72'} border-r border-border flex flex-col bg-background-secondary transition-all duration-300 overflow-hidden`}>
                {/* Header */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-text-primary">Notes</h2>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    setEditingFolder(null);
                                    setShowFolderModal(true);
                                }}
                                className="p-2 text-text-muted hover:bg-background-hover rounded-lg transition-colors"
                                title="New folder"
                            >
                                <FolderPlus size={18} />
                            </button>
                            <button
                                onClick={() => handleCreateNote()}
                                className="p-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors"
                                title="New note"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search notes..."
                            className="w-full pl-9 pr-3 py-2 bg-background-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                        />
                    </div>
                </div>

                {/* Folders & Notes */}
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="p-2 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="space-y-2">
                                    <Skeleton width="60%" height={24} variant="rect" />
                                    <div className="ml-4 space-y-2 border-l border-border/50 pl-2">
                                        <Skeleton width="80%" height={20} />
                                        <Skeleton width="70%" height={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Folders */}
                            {folders.map(renderFolder)}

                            {/* Unfiled Notes */}
                            {(notesByFolder['unfiled']?.length > 0 || folders.length === 0) && (
                                <div className="mt-2">
                                    {folders.length > 0 && (
                                        <div className="px-3 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider opacity-60">
                                            Unfiled
                                        </div>
                                    )}
                                    {(searchQuery ? filterTree(notesByFolder['unfiled'] || [], searchQuery) : notesByFolder['unfiled'] || []).length > 0 ? (
                                        (searchQuery ? filterTree(notesByFolder['unfiled'] || [], searchQuery) : notesByFolder['unfiled'] || []).map(
                                            (note) => renderNoteItem(note, 0)
                                        )
                                    ) : (
                                        folders.length === 0 && !searchQuery && (
                                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                                <div className="w-12 h-12 bg-background-hover rounded-full flex items-center justify-center mb-3">
                                                    <FileText size={24} className="text-text-muted opacity-40" />
                                                </div>
                                                <h3 className="text-sm font-bold text-text-primary mb-1">Start writing your first note</h3>
                                                <p className="text-xs text-text-muted">Stay organized by capturing your thoughts and ideas.</p>
                                                <button
                                                    onClick={() => handleCreateNote()}
                                                    className="btn btn-primary btn-sm mt-4 px-4"
                                                >
                                                    <Plus size={14} />
                                                    Create Note
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Search-specific Empty state */}
                            {searchQuery && folders.every(f => !filterTree(notesByFolder[f.id] || [], searchQuery).length) && (!notesByFolder['unfiled'] || !filterTree(notesByFolder['unfiled'], searchQuery).length) && (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="w-12 h-12 bg-background-hover rounded-full flex items-center justify-center mb-3">
                                        <Search size={24} className="text-text-muted opacity-40" />
                                    </div>
                                    <h3 className="text-sm font-bold text-text-primary mb-1">No notes found</h3>
                                    <p className="text-xs text-text-muted">Try different keywords or check your spelling.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Sidebar Toggle Button */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute top-4 left-4 z-10 p-2 bg-background-card border border-border rounded-lg hover:bg-background-hover transition-colors shadow-sm"
                    title={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                >
                    {isSidebarCollapsed ? (
                        <ChevronRight size={20} className="text-text-muted" />
                    ) : (
                        <ChevronLeft size={20} className="text-text-muted" />
                    )}
                </button>
                {selectedNote ? (
                    <NoteEditor
                        note={selectedNote}
                        folders={folders}
                        breadcrumb={breadcrumb}
                        onUpdate={async (updates) => {
                            // Optimistic Updates to ensure Real-Time UI
                            queryClient.setQueryData(['notes-tree'], (oldTree: any) => {
                                if (!oldTree) return [];
                                const updateNode = (nodes: any[]): any[] => {
                                    return nodes.map(node => {
                                        if (node.id === selectedNote.id) return { ...node, ...updates };
                                        if (node.children?.length) return { ...node, children: updateNode(node.children) };
                                        return node;
                                    });
                                };
                                return updateNode(oldTree);
                            });

                            queryClient.setQueryData(['note', selectedNote.id], (oldNote: any) => {
                                if (!oldNote) return oldNote;
                                let newSection = oldNote.section;
                                if ('section_id' in updates) {
                                    newSection = folders.find((s: any) => s.id === updates.section_id) || null;
                                }
                                return { ...oldNote, ...updates, section: newSection };
                            });

                            await updateMutation.mutateAsync({ id: selectedNote.id, data: updates });

                            // Re-verify with server
                            await Promise.all([
                                refetchTree(),
                                queryClient.invalidateQueries({ queryKey: ['note'] }),
                                queryClient.invalidateQueries({ queryKey: ['note-breadcrumb'] })
                            ]);
                        }}
                        onDelete={() => handleDeleteNote(selectedNote.id)}
                        onBreadcrumbNavigate={handleBreadcrumbNavigate}
                        isUpdating={updateMutation.isPending}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
                        <div className="text-center">
                            <div className="text-6xl mb-4">📝</div>
                            <h3 className="text-xl font-semibold text-text-primary mb-2">
                                Select a note or create one
                            </h3>
                            <p className="text-sm mb-6">
                                Organize your notes in folders with nested pages
                            </p>
                            <div className="flex items-center gap-3 justify-center">
                                <button
                                    onClick={() => {
                                        setEditingFolder(null);
                                        setShowFolderModal(true);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-border text-text-primary rounded-lg hover:bg-background-hover transition-colors"
                                >
                                    <FolderPlus size={18} />
                                    New Folder
                                </button>
                                <button
                                    onClick={() => handleCreateNote()}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors"
                                >
                                    <Plus size={18} />
                                    New Note
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setNoteToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Note"
                message={getDeleteMessage()}
            />

            {/* Folder Delete Confirmation */}
            <ConfirmModal
                isOpen={showFolderDeleteConfirm}
                onClose={() => {
                    setShowFolderDeleteConfirm(false);
                    setFolderToDelete(null);
                }}
                onConfirm={() => {
                    if (folderToDelete) {
                        deleteFolderMutation.mutate(folderToDelete.id);
                    }
                    setShowFolderDeleteConfirm(false);
                    setFolderToDelete(null);
                }}
                title="Delete Folder"
                message={`Are you sure you want to delete the folder "${folderToDelete?.name}"? This will move its notes to "Unfiled".`}
            />

            {/* Folder Modal */}
            {showFolderModal && (
                <FolderModal
                    folder={editingFolder}
                    onClose={() => {
                        setShowFolderModal(false);
                        setEditingFolder(null);
                    }}
                    onSave={(data) => {
                        if (editingFolder) {
                            updateFolderMutation.mutate({ id: editingFolder.id, data });
                        } else {
                            createFolderMutation.mutate(data);
                        }
                    }}
                    onDelete={editingFolder ? () => {
                        deleteFolderMutation.mutate(editingFolder.id);
                        setShowFolderModal(false);
                        setEditingFolder(null);
                    } : undefined}
                />
            )}
        </div>
    );
}

// Folder Modal Component
function FolderModal({
    folder,
    onClose,
    onSave,
    onDelete,
}: {
    folder: NoteSection | null;
    onClose: () => void;
    onSave: (data: { name: string; color: string }) => void;
    onDelete?: () => void;
}) {
    const [name, setName] = useState(folder?.name || '');
    const [color, setColor] = useState(folder?.color || FOLDER_COLORS[0].value);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave({ name: name.trim(), color });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-background-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                    {folder ? 'Edit Folder' : 'New Folder'}
                </h3>

                <form onSubmit={handleSubmit}>
                    {/* Folder Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Folder Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Folder"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                            autoFocus
                        />
                    </div>

                    {/* Color Picker */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Color
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {FOLDER_COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    className={`relative flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${color === c.value
                                        ? 'border-white'
                                        : 'border-transparent hover:border-white/30'
                                        }`}
                                    style={{ backgroundColor: c.value + '20' }}
                                    title={c.name}
                                >
                                    <Folder size={24} style={{ color: c.value }} />
                                    {color === c.value && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                            <Check size={12} className="text-background" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        {onDelete ? (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="px-3 py-2 text-sm text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                            >
                                Delete Folder
                            </button>
                        ) : (
                            <div />
                        )}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm text-text-muted hover:bg-background-hover rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!name.trim()}
                                className="px-4 py-2 text-sm bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors disabled:opacity-50"
                            >
                                {folder ? 'Save' : 'Create'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Note Editor Component
function NoteEditor({
    note,
    folders,
    breadcrumb,
    onUpdate,
    onDelete,
    onBreadcrumbNavigate,
    isUpdating,
}: {
    note: Note;
    folders: NoteSection[];
    breadcrumb: NoteBreadcrumb[];
    onUpdate: (updates: UpdateNote) => void | Promise<void>;
    onDelete: () => void;
    onBreadcrumbNavigate: (id: number | null) => void;
    isUpdating: boolean;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [icon, setIcon] = useState(note.icon || '📄');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showFolderPicker, setShowFolderPicker] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(note.section_id || null);
    const navigate = useNavigate();

    // Reset state when note changes (but NOT while editing)
    useEffect(() => {
        if (isEditing) return;
        setTitle(note.title);
        setContent(note.content);
        setIcon(note.icon || '📄');
        setSelectedFolderId(note.section_id || null);
    }, [note.id, note.section_id, isEditing]);

    // Handlers
    const handleSave = async () => {
        await onUpdate({ title, content, icon, section_id: selectedFolderId });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTitle(note.title);
        setContent(note.content);
        setIcon(note.icon || '📄');
        setSelectedFolderId(note.section_id || null);
        setIsEditing(false);
    };

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
    };

    const handleIconChange = (newIcon: string) => {
        setIcon(newIcon);
        setShowIconPicker(false);
    };

    const handleStartEdit = () => {
        setIsEditing(true);
    };

    // Get current folder (use local selection if editing)
    const currentFolder = folders.find(f => f.id === (isEditing ? selectedFolderId : note.section_id));

    // Ctrl+S to save when editing
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's' && isEditing) {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, title, content, icon]);

    return (
        <>
            {/* Header with Breadcrumb */}
            <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background-secondary">
                <div className="flex items-center gap-4">
                    {/* Mobile back button */}
                    <button
                        onClick={() => navigate('/notes')}
                        className="p-2 hover:bg-background-hover rounded-lg transition-colors md:hidden"
                    >
                        <ArrowLeft size={20} className="text-text-muted" />
                    </button>

                    {/* Breadcrumb */}
                    <Breadcrumb items={breadcrumb} onNavigate={onBreadcrumbNavigate} />
                </div>

                <div className="flex items-center gap-2">
                    {/* Status indicator */}
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                        {isUpdating ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : isEditing ? (
                            <span className="text-accent-amber">Editing...</span>
                        ) : (
                            <>
                                <Check size={14} className="text-accent-green" />
                                <span>Saved</span>
                            </>
                        )}
                    </div>

                    {/* Edit button when NOT editing */}
                    {!isEditing && (
                        <button
                            onClick={handleStartEdit}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors"
                        >
                            <Edit3 size={14} />
                            Edit
                        </button>
                    )}

                    {/* Save and Cancel buttons when editing */}
                    {isEditing && (
                        <>
                            <button
                                onClick={handleCancel}
                                className="px-3 py-1.5 text-sm text-text-muted hover:bg-background-hover rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-3 py-1.5 text-sm bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors"
                            >
                                Save
                            </button>
                        </>
                    )}


                    {/* Folder Picker (only for root notes and in edit mode) */}
                    {isEditing && !note.parent_id && (
                        <div className="relative">
                            <button
                                onClick={() => setShowFolderPicker(!showFolderPicker)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-background-hover transition-colors"
                            >
                                {currentFolder ? (
                                    <>
                                        <Folder size={14} style={{ color: currentFolder.color }} />
                                        <span className="text-text-secondary">{currentFolder.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Folder size={14} className="text-text-muted" />
                                        <span className="text-text-muted">No folder</span>
                                    </>
                                )}
                                <ChevronDown size={14} className="text-text-muted" />
                            </button>

                            {showFolderPicker && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-background-card border border-border rounded-lg shadow-lg z-50 py-1">
                                    <button
                                        onClick={(e: any) => {
                                            e.stopPropagation();
                                            setSelectedFolderId(null);
                                            setShowFolderPicker(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-background-hover transition-colors"
                                    >
                                        <Folder size={14} className="text-text-muted" />
                                        <span className="text-text-muted">No folder</span>
                                    </button>
                                    {folders.map((folder) => (
                                        <button
                                            key={folder.id}
                                            onClick={(e: any) => {
                                                e.stopPropagation();
                                                setSelectedFolderId(folder.id);
                                                setShowFolderPicker(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-background-hover transition-colors"
                                        >
                                            <Folder size={14} style={{ color: folder.color }} />
                                            <span>{folder.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pin Toggle */}
                    <button
                        onClick={() => onUpdate({ is_pinned: !note.is_pinned })}
                        className={`p-2 rounded-lg transition-colors ${note.is_pinned
                            ? 'text-amber-500 bg-amber-500/10'
                            : 'text-text-muted hover:bg-background-hover'
                            }`}
                        title={note.is_pinned ? 'Unpin note' : 'Pin note'}
                    >
                        <Pin size={18} />
                    </button>

                    <button
                        onClick={onDelete}
                        className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </header>

            {/* Editor */}
            <div className="flex-1 overflow-auto p-6">
                <div className="w-full px-4">
                    {/* Icon and Title */}
                    <div className="flex items-start gap-4 mb-6">
                        {/* Icon Picker */}
                        <div className="relative">
                            <button
                                onClick={() => isEditing && setShowIconPicker(!showIconPicker)}
                                className={`text-5xl hover:opacity-80 transition-opacity ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                                disabled={!isEditing}
                            >
                                {icon}
                            </button>

                            {showIconPicker && (
                                <div className="absolute left-0 top-full mt-2 p-3 bg-background-card border border-border rounded-lg shadow-lg z-50 grid grid-cols-9 gap-1 w-96 max-h-64 overflow-y-auto">
                                    {EMOJI_OPTIONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleIconChange(emoji)}
                                            className="text-2xl p-2 hover:bg-background-hover rounded transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        {isEditing ? (
                            <input
                                type="text"
                                value={title}
                                onChange={handleTitleChange}
                                placeholder="Untitled"
                                className="flex-1 text-3xl font-bold text-text-primary bg-transparent border-none focus:outline-none"
                                autoFocus
                            />
                        ) : (
                            <h1 className="flex-1 text-3xl font-bold text-text-primary">
                                {note.title || 'Untitled'}
                            </h1>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="text-sm text-text-muted mb-6">
                        Last updated {format(new Date(note.updated_at.endsWith('Z') ? note.updated_at : note.updated_at + 'Z'), 'MMM d, yyyy \'at\' h:mm a')}
                    </div>

                    <div className="min-h-[500px]">
                        <RichTextEditor
                            content={content}
                            onChange={handleContentChange}
                            isEditable={isEditing}
                            placeholder="Start writing... Use markdown shortcuts like # for headings, - [ ] for checklists, ``` for code blocks"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
