import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { notesApi } from '../lib/api';
import type { NoteTreeItem } from '../types';

export default function NoteSwitcher() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [notes, setNotes] = useState<NoteTreeItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        if (open) {
            const fetchNotes = async () => {
                setIsLoading(true);
                try {
                    // Get all notes as a flat list is better for fuzzy search
                    // For now, we'll fetch the tree and flatten it
                    const tree = await notesApi.getTree();
                    const flat: NoteTreeItem[] = [];
                    const flatten = (items: NoteTreeItem[]) => {
                        items.forEach(item => {
                            flat.push(item);
                            if (item.children) flatten(item.children);
                        });
                    };
                    flatten(tree);
                    setNotes(flat);
                } catch (error) {
                    console.error('Failed to fetch notes for switcher:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchNotes();
        } else {
            setSearch('');
        }
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
        >
            <div
                className="w-full max-w-xl bg-background-card border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <Command className="w-full">
                    <div className="flex items-center border-b border-border px-3">
                        <Search className="w-4 h-4 text-text-muted mr-2" />
                        <Command.Input
                            autoFocus
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Jump to note..."
                            className="w-full py-4 bg-transparent outline-none text-text-primary placeholder:text-text-muted text-sm"
                        />
                        <div className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 text-[10px] text-text-muted border border-border rounded bg-background">ESC</kbd>
                        </div>
                    </div>

                    <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
                        <Command.Empty className="py-8 text-center text-sm text-text-muted">
                            {isLoading ? 'Loading notes...' : 'No notes found.'}
                        </Command.Empty>

                        <Command.Group heading="Notes" className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-2 py-1.5">
                            {notes.map((note) => (
                                <Command.Item
                                    key={note.id}
                                    onSelect={() => {
                                        navigate(`/notes/${note.id}`);
                                        setOpen(false);
                                    }}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary aria-selected:bg-accent-blue/10 aria-selected:text-accent-blue cursor-pointer transition-colors"
                                >
                                    <span className="text-base shrink-0">{note.icon || '📄'}</span>
                                    <div className="flex-1 truncate font-medium">{note.title || 'Untitled'}</div>
                                    <div className="text-[10px] text-text-muted bg-background px-1.5 py-0.5 rounded border border-border/50">
                                        Note
                                    </div>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    </Command.List>

                    <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[10px] text-text-muted bg-background/50">
                        <div className="flex items-center gap-3">
                            <span><kbd className="px-1 py-0.5 rounded border border-border">↑↓</kbd> Navigate</span>
                            <span><kbd className="px-1 py-0.5 rounded border border-border">↵</kbd> Select</span>
                        </div>
                    </div>
                </Command>
            </div>
        </div>
    );
}
