import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Code, Search, Loader2, Trash2, Copy, Check, X } from 'lucide-react';
import { snippetsApi } from '../lib/api';
import CodeBlock from '../components/CodeBlock';
import type { Snippet, CreateSnippet, UpdateSnippet } from '../types';

const LANGUAGES = [
    'python', 'javascript', 'typescript', 'sql', 'bash', 'shell',
    'java', 'go', 'rust', 'cpp', 'c', 'csharp', 'ruby', 'php',
    'html', 'css', 'json', 'yaml', 'xml', 'markdown', 'text'
];

export default function Snippets() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [languageFilter, setLanguageFilter] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const { data: snippets = [], isLoading } = useQuery({
        queryKey: ['snippets', languageFilter, searchQuery],
        queryFn: () => snippetsApi.getAll(languageFilter || undefined, searchQuery || undefined),
    });

    const createMutation = useMutation({
        mutationFn: (snippet: CreateSnippet) => snippetsApi.create(snippet),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['snippets'] });
            setIsCreating(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => snippetsApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['snippets'] }),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <header className="sticky top-0 z-10 bg-background border-b border-border px-8 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Code size={24} className="text-accent-blue" />
                        Code Snippets
                    </h1>
                    <button onClick={() => setIsCreating(true)} className="btn btn-primary">
                        <Plus size={18} /> New Snippet
                    </button>
                </div>
                <div className="flex items-center gap-4 mt-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search snippets..."
                            className="input pl-9"
                        />
                    </div>
                    <select
                        value={languageFilter}
                        onChange={(e) => setLanguageFilter(e.target.value)}
                        className="input w-40"
                    >
                        <option value="">All Languages</option>
                        {LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-5xl mx-auto">
                    {isCreating && (
                        <CreateForm
                            onSubmit={(data) => createMutation.mutate(data)}
                            onCancel={() => setIsCreating(false)}
                            isLoading={createMutation.isPending}
                        />
                    )}

                    {snippets.length > 0 ? (
                        <div className="grid gap-6">
                            {snippets.map((snippet) => (
                                <SnippetCard
                                    key={snippet.id}
                                    snippet={snippet}
                                    onDelete={() => deleteMutation.mutate(snippet.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState onCreate={() => setIsCreating(true)} />
                    )}
                </div>
            </div>
        </div>
    );
}

function CreateForm({ onSubmit, onCancel, isLoading }: {
    onSubmit: (d: CreateSnippet) => void;
    onCancel: () => void;
    isLoading: boolean
}) {
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [description, setDescription] = useState('');

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, code, language, description }); }} className="card p-6 mb-6">
            <div className="flex justify-between mb-4">
                <h3 className="font-semibold text-text-primary">New Snippet</h3>
                <button type="button" onClick={onCancel}><X size={18} className="text-text-muted" /></button>
            </div>
            <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Snippet title" className="input" required />
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input">
                        {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="// Your code here" rows={8} className="input font-mono text-sm" required />
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="input" />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>
                    <button type="submit" disabled={isLoading} className="btn btn-primary">{isLoading ? 'Saving...' : 'Create'}</button>
                </div>
            </div>
        </form>
    );
}

function SnippetCard({ snippet, onDelete }: { snippet: Snippet; onDelete: () => void }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        await navigator.clipboard.writeText(snippet.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="card overflow-hidden group">
            <div className="flex items-center justify-between px-4 py-3 bg-background-elevated border-b border-border">
                <div className="flex items-center gap-3">
                    <h3 className="font-medium text-text-primary">{snippet.title}</h3>
                    <span className="badge badge-blue">{snippet.language}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleCopy} className="p-2 hover:bg-background-hover rounded-lg">
                        {copied ? <Check size={16} className="text-accent-green" /> : <Copy size={16} className="text-text-muted" />}
                    </button>
                    <button onClick={onDelete} className="p-2 hover:bg-accent-red/10 rounded-lg">
                        <Trash2 size={16} className="text-accent-red" />
                    </button>
                </div>
            </div>
            <div className="p-4">
                <CodeBlock code={snippet.code} language={snippet.language} />
            </div>
            {snippet.description && <div className="px-4 pb-4"><p className="text-sm text-text-muted">{snippet.description}</p></div>}
            <div className="px-4 pb-3 text-xs text-text-muted">Updated {format(new Date(snippet.updated_at), 'MMM d, h:mm a')}</div>
        </div>
    );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="card p-12 text-center">
            <Code size={48} className="mx-auto mb-4 text-text-muted/30" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No snippets yet</h3>
            <p className="text-text-muted mb-4">Save your frequently used code snippets here</p>
            <button onClick={onCreate} className="btn btn-primary"><Plus size={18} /> Create Snippet</button>
        </div>
    );
}
