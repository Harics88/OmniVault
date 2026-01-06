import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Code, Search, Loader2, Trash2, Edit2, X, MoreHorizontal, Copy, Check, Pin, Database, Terminal, FileCode, ChevronUp, ChevronDown } from 'lucide-react';
import { snippetsApi } from '../lib/api';
import CodeBlock from '../components/CodeBlock';
import type { Snippet, CreateSnippet, UpdateSnippet } from '../types';
import ConfirmModal from '../components/ConfirmModal';

// Icons
const PythonIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
        <path fill="#3776AB" d="M14.31.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.83l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.23l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05L0 11.97l.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.24l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05 1.07.13zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09-.33.22z" />
        <path fill="#FFD43B" d="M21.1 6.11l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.10.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01.21.03zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08-.33.23z" />
    </svg>
);

const LANGUAGE_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode; color: string }> = {
    python: {
        label: 'Python',
        className: 'bg-[#3776AB]/10 text-[#3776AB] border-[#3776AB]/20',
        icon: <PythonIcon />,
        color: '#3776AB'
    },
    sql: {
        label: 'SQL',
        className: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        icon: <Database size={18} />,
        color: 'rgb(249 115 22)'
    },
    bash: {
        label: 'Bash',
        className: 'bg-green-500/10 text-green-500 border-green-500/20',
        icon: <Terminal size={18} />,
        color: 'rgb(34 197 94)'
    },
    shell: {
        label: 'Shell',
        className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        icon: <Terminal size={18} />,
        color: 'rgb(156 163 175)'
    },
};

const LANGUAGES = Object.keys(LANGUAGE_CONFIG);

export default function Snippets() {
    const { id: urlId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [languageFilter, setLanguageFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Initial check for URL ID
    useEffect(() => {
        if (urlId) {
            const id = parseInt(urlId);
            if (!isNaN(id)) {
                snippetsApi.getById(id).then(snippet => {
                    setEditingSnippet(snippet);
                    setIsModalOpen(true);
                }).catch(() => {
                    navigate('/snippets', { replace: true });
                });
            }
        }
    }, [urlId, navigate]);

    // Handle modal close to clear URL
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSnippet(null);
        if (urlId) {
            navigate('/snippets', { replace: true });
        }
    };

    // Debounce search to prevent focus loss
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: snippets = [], isLoading } = useQuery({
        queryKey: ['snippets', languageFilter, searchQuery],
        queryFn: () => snippetsApi.getAll(languageFilter || undefined, searchQuery || undefined),
    });

    const createMutation = useMutation({
        mutationFn: (snippet: CreateSnippet) => snippetsApi.create(snippet),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['snippets'] });
            queryClient.invalidateQueries({ queryKey: ['system'] });
            handleCloseModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateSnippet }) => snippetsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['snippets'] });
            queryClient.invalidateQueries({ queryKey: ['system'] });
            handleCloseModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => snippetsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['snippets'] });
            queryClient.invalidateQueries({ queryKey: ['system'] });
        },
    });

    const handleEdit = (snippet: Snippet) => {
        setEditingSnippet(snippet);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingSnippet(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    const handleTogglePin = async (e: React.MouseEvent, snippet: Snippet) => {
        e.stopPropagation();
        await updateMutation.mutateAsync({
            id: snippet.id,
            data: { is_pinned: !snippet.is_pinned }
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background animate-fade-in">
            {/* Header Section */}
            <div className="px-8 py-6 border-b border-border">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary mb-1">Snippets Library</h1>
                        <p className="text-sm text-text-muted">Manage and organize your code library</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} /> New Snippet
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent-blue" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search snippets..."
                            className="input pl-10 w-full bg-background-elevated border-border-subtle focus:bg-background"
                        />
                    </div>
                    <select
                        value={languageFilter}
                        onChange={(e) => setLanguageFilter(e.target.value)}
                        className="input w-48 bg-background-elevated border-border-subtle"
                    >
                        <option value="">All Languages</option>
                        {LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>{LANGUAGE_CONFIG[lang]?.label || lang}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-auto bg-background">
                {snippets.length === 0 ? (
                    <EmptyState onCreate={handleCreate} />
                ) : (
                    <div className="min-w-full inline-block align-middle">
                        <div className="border-b border-border-subtle">
                            <div className="grid grid-cols-12 gap-4 px-8 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                <div className="col-span-1"></div> {/* Chevron column */}
                                <div className="col-span-5">Title</div>
                                <div className="col-span-2">Language</div>
                                <div className="col-span-2">Updated (EST)</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                        </div>
                        <div className="divide-y divide-border-subtle">
                            {snippets.map((snippet) => (
                                <SnippetRow
                                    key={snippet.id}
                                    snippet={snippet}
                                    onEdit={() => handleEdit(snippet)}
                                    onDelete={(e) => handleDelete(e, snippet.id)}
                                    onTogglePin={(e) => handleTogglePin(e, snippet)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            {isModalOpen && (
                <SnippetModal
                    snippet={editingSnippet}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={(data) => {
                        if (editingSnippet) {
                            updateMutation.mutate({ id: editingSnippet.id, data });
                        } else {
                            createMutation.mutate(data as CreateSnippet);
                        }
                    }}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            )}

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Snippet"
                message="Are you sure you want to delete this snippet? This action cannot be undone."
            />
        </div>
    );
}

function SnippetRow({
    snippet,
    onEdit,
    onDelete,
    onTogglePin
}: {
    snippet: Snippet;
    onEdit: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onTogglePin: (e: React.MouseEvent) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const langConfig = LANGUAGE_CONFIG[snippet.language] || {
        label: snippet.language,
        className: 'bg-background-elevated text-text-secondary border-border-subtle',
        icon: <Code size={18} />
    };

    const handleRowClick = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="group transition-colors border-b border-border-subtle last:border-0">
            <div
                onClick={handleRowClick}
                className={`grid grid-cols-12 gap-4 px-8 py-4 items-center cursor-pointer transition-colors ${isExpanded ? 'bg-background-elevated/50' : 'hover:bg-background-hover'}`}
            >
                <div className="col-span-1 text-text-muted">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-background-elevated transition-colors ${langConfig.className.split(' ').slice(1, 3).join(' ')}`}>
                        {langConfig.icon}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-text-primary text-sm group-hover:text-accent-blue transition-colors truncate">
                                {snippet.title}
                            </h3>
                            {snippet.is_pinned && (
                                <Pin size={12} className="text-accent-blue fill-accent-blue shrink-0" />
                            )}
                        </div>
                        {snippet.description && (
                            <p className="text-xs text-text-muted truncate max-w-[300px]">
                                {snippet.description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${langConfig.className}`}>
                        {langConfig.label}
                    </span>
                </div>
                <div className="col-span-2 text-sm text-text-muted">
                    {format(new Date(snippet.updated_at.endsWith('Z') ? snippet.updated_at : snippet.updated_at + 'Z'), 'MMM d, yyyy')}
                    <span className="text-xs opacity-50 ml-1">
                        {format(new Date(snippet.updated_at.endsWith('Z') ? snippet.updated_at : snippet.updated_at + 'Z'), 'h:mm a')}
                    </span>
                </div>
                <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onTogglePin}
                        className={`p-1.5 rounded-md transition-colors ${snippet.is_pinned ? 'text-accent-blue bg-accent-blue/10' : 'text-text-muted hover:text-accent-blue hover:bg-accent-blue/10'}`}
                        title={snippet.is_pinned ? "Unpin" : "Pin"}
                    >
                        <Pin size={16} className={snippet.is_pinned ? "fill-current" : ""} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1.5 text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 rounded-md transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-md transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="px-8 pb-4 bg-background-elevated/50">
                    <div className="pl-6">
                        <CodeBlock code={snippet.code} language={snippet.language} />
                    </div>
                </div>
            )}
        </div>
    );
}

function SnippetModal({
    snippet,
    isOpen,
    onClose,
    onSubmit,
    isLoading
}: {
    snippet: Snippet | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateSnippet) => void;
    isLoading: boolean;
}) {
    const [formData, setFormData] = useState<CreateSnippet>({
        title: snippet?.title || '',
        code: snippet?.code || '',
        language: snippet?.language || 'python',
        description: snippet?.description || '',
    });

    if (!isOpen) return null;

    const currentLang = LANGUAGE_CONFIG[formData.language || 'python'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-4xl bg-background-card rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-primary">
                        {snippet ? 'Edit Snippet' : 'New Snippet'}
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="grid gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-text-secondary uppercase">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Database Connection"
                                    className="input w-full"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-text-secondary uppercase">Language</label>
                                <div className="relative">
                                    <select
                                        value={formData.language}
                                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                        className="input w-full pl-9"
                                    >
                                        {LANGUAGES.map((lang) => (
                                            <option key={lang} value={lang}>{LANGUAGE_CONFIG[lang]?.label || lang}</option>
                                        ))}
                                    </select>
                                    {/* Color preview badge absolute positioned inside selected */}
                                    <div
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/20 z-10 pointer-events-none"
                                        style={{ backgroundColor: currentLang?.color }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-text-secondary uppercase">Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of what this snippet does..."
                                className="input w-full"
                            />
                        </div>

                        <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
                            <label className="text-xs font-medium text-text-secondary uppercase">Code</label>
                            <textarea
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="input flex-1 font-mono text-sm leading-relaxed p-4 resize-none"
                                placeholder="// Paste your code here..."
                                spellCheck={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-border bg-background-elevated rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="btn btn-ghost"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(formData)}
                        disabled={!formData.title || !formData.code || isLoading}
                        className="btn btn-primary min-w-[100px]"
                    >
                        {isLoading ? (
                            <Loader2 size={16} className="animate-spin mr-2" />
                        ) : null}
                        {snippet ? 'Save Changes' : 'Create Snippet'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
            <div className="w-16 h-16 rounded-full bg-background-elevated flex items-center justify-center mb-6">
                <Code size={32} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No snippets found</h3>
            <p className="text-text-muted max-w-sm mb-8">
                Build your personal library of code snippets. They're searchable, filterable, and always ready to copy.
            </p>
            <button onClick={onCreate} className="btn btn-primary px-6 py-2.5">
                <Plus size={18} className="mr-2" /> Create Your First Snippet
            </button>
        </div>
    );
}
