import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, CheckSquare, FileText, Code, Bookmark, Settings,
    Sun, Plus, Search, Home, Trash2, Download, Upload,
    HelpCircle, User
} from 'lucide-react';
import { searchApi } from '../lib/api';
import type { SearchResult } from '../types';
import { useToast } from './Toast';

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Determine if we're in command mode (starts with >) or search mode
    const isCommandMode = search.startsWith('>');
    const searchQuery = isCommandMode ? search.slice(1).trim() : search;

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            // Don't open if Ctrl/Cmd is NOT held and we are inside a Tiptap editor
            // This allows Tiptap's slash menu to work
            const isInsideEditor = () => {
                const active = document.activeElement;
                return active?.closest('.ProseMirror') !== null ||
                    active?.tagName === 'INPUT' ||
                    active?.tagName === 'TEXTAREA';
            };

            if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !isInsideEditor())) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            // Close on Escape
            if (e.key === 'Escape' && open) {
                e.preventDefault();
                setOpen(false);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [open]);

    // Reset state when opening/closing
    useEffect(() => {
        if (open) {
            setSearch('');
            setSearchResults([]);
        }
    }, [open]);

    // Perform search when not in command mode
    useEffect(() => {
        const performSearch = async () => {
            if (isCommandMode || searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await searchApi.search(searchQuery);
                setSearchResults(response.results || []);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, isCommandMode]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        setTimeout(command, 100); // Small delay for better UX
    };

    const toggleTheme = () => {
        const current = localStorage.getItem('theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', next);
        document.documentElement.classList.toggle('light', next === 'light');
        showToast(`🎨 Theme switched to ${next === 'dark' ? 'Dark' : 'Light'} mode`);
        window.dispatchEvent(new Event('storage'));
    };

    const togglePersonalTasks = () => {
        const current = localStorage.getItem('enablePersonalTasks') === 'true';
        const next = !current;
        localStorage.setItem('enablePersonalTasks', String(next));
        showToast(next ? '👤 Personal Tasks mode enabled' : '💼 Work Tasks mode enabled');
        window.dispatchEvent(new Event('storage'));
    };

    const navigateToSearchResult = (result: SearchResult) => {
        const routes: Record<string, string> = {
            task: `/tasks`,
            note: `/notes/${result.id}`,
            snippet: `/snippets/${result.id}`,
            bookmark: `/bookmarks`,
            daily_log: result.metadata?.date ? `/daily-log/${result.metadata.date}` : `/daily-log`,
        };
        runCommand(() => navigate(routes[result.type]));
    };

    const exportData = async () => {
        try {
            const response = await fetch('/api/data/export', {
                method: 'GET',
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `omnivault_backup_${new Date().toISOString().slice(0, 10)}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        }
    };

    const searchResultIcons: Record<string, any> = {
        task: CheckSquare,
        note: FileText,
        snippet: Code,
        bookmark: Bookmark,
        daily_log: Calendar,
    };

    const searchResultColors: Record<string, string> = {
        task: 'text-accent-amber',
        note: 'text-accent-blue',
        snippet: 'text-accent-green',
        bookmark: 'text-purple-400',
        daily_log: 'text-text-secondary',
    };

    // If not open, don't render anything
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
        >
            <div
                className="w-full max-w-2xl bg-background-card border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <Command
                    className="w-full"
                    filter={(value: string, search: string) => {
                        const query = search.startsWith('>') ? search.slice(1).toLowerCase().trim() : search.toLowerCase().trim();
                        if (!query) return 1;
                        if (value.toLowerCase().includes(query)) return 1;
                        return 0;
                    }}
                >
                    <div className="flex items-center border-b border-border px-3">
                        <Search className="w-5 h-5 text-text-muted mr-2" />
                        <Command.Input
                            autoFocus
                            value={search}
                            onValueChange={setSearch}
                            placeholder={isCommandMode ? "Type a command..." : "Search or type '>' for commands..."}
                            className="w-full py-4 bg-transparent outline-none text-text-primary placeholder:text-text-muted"
                        />
                        <kbd className="px-2 py-1 text-xs text-text-muted border border-border rounded">ESC</kbd>
                    </div>

                    <Command.List className="max-h-[400px] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
                        <Command.Empty className="py-8 text-center text-sm text-text-muted">
                            {isSearching ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                                    <span>Searching...</span>
                                </div>
                            ) : (
                                'No results found.'
                            )}
                        </Command.Empty>

                        {/* Search Results Mode */}
                        {!isCommandMode && searchResults.length > 0 && (
                            <Command.Group heading="Search Results" className="text-xs font-semibold text-text-muted px-2 py-1.5">
                                {searchResults.map((result) => {
                                    const Icon = searchResultIcons[result.type];
                                    const colorClass = searchResultColors[result.type];
                                    return (
                                        <CommandItem
                                            key={`${result.type}-${result.id}`}
                                            onSelect={() => navigateToSearchResult(result)}
                                            icon={Icon}
                                            iconColor={colorClass}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{result.title}</div>
                                                <div className="text-xs text-text-muted truncate">{stripHtml(result.preview)}</div>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded ${colorClass} bg-background ml-2`}>
                                                {result.type.replace('_', ' ')}
                                            </span>
                                        </CommandItem>
                                    );
                                })}
                            </Command.Group>
                        )}

                        {/* Command Mode - Show when starting with > or when search is empty */}
                        {(isCommandMode || (!search && searchResults.length === 0)) && (
                            <>
                                <Command.Group heading="Navigation" className="text-xs font-semibold text-text-muted px-2 py-1.5">
                                    <CommandItem onSelect={() => runCommand(() => navigate('/'))} icon={Home} shortcut="g h">
                                        Go to Home
                                    </CommandItem>
                                    <CommandItem onSelect={() => runCommand(() => navigate('/daily-log'))} icon={Calendar} shortcut="g d">
                                        Go to Daily Log
                                    </CommandItem>
                                    <CommandItem onSelect={() => runCommand(() => navigate('/tasks'))} icon={CheckSquare} shortcut="g t">
                                        Go to Tasks
                                    </CommandItem>
                                    <CommandItem onSelect={() => runCommand(() => navigate('/notes'))} icon={FileText} shortcut="g n">
                                        Go to Notes
                                    </CommandItem>
                                    <CommandItem onSelect={() => runCommand(() => navigate('/snippets'))} icon={Code} shortcut="g s">
                                        Go to Snippets
                                    </CommandItem>
                                    <CommandItem onSelect={() => runCommand(() => navigate('/bookmarks'))} icon={Bookmark} shortcut="g b">
                                        Go to Bookmarks
                                    </CommandItem>
                                    <CommandItem onSelect={() => runCommand(() => navigate('/settings'))} icon={Settings} shortcut="g ,">
                                        Go to Settings
                                    </CommandItem>
                                </Command.Group>

                                <Command.Group heading="Create" className="text-xs font-semibold text-text-muted px-2 py-1.5 mt-2">
                                    <CommandItem onSelect={() => runCommand(() => navigate('/tasks?new=true'))} icon={Plus}>
                                        Create Task
                                    </CommandItem>
                                    <CommandItem onSelect={() => runCommand(() => navigate('/notes?new=true'))} icon={Plus}>
                                        Create Note
                                    </CommandItem>
                                    <CommandItem onSelect={() => runCommand(() => navigate('/snippets?new=true'))} icon={Plus}>
                                        Create Snippet
                                    </CommandItem>
                                    <CommandItem onSelect={() => runCommand(() => navigate('/bookmarks?new=true'))} icon={Plus}>
                                        Create Bookmark
                                    </CommandItem>
                                </Command.Group>

                                <Command.Group heading="Settings & Preferences" className="text-xs font-semibold text-text-muted px-2 py-1.5 mt-2">
                                    <CommandItem onSelect={() => runCommand(toggleTheme)} icon={Sun}>
                                        Toggle Theme (Dark/Light)
                                    </CommandItem>
                                    <CommandItem onSelect={() => runCommand(togglePersonalTasks)} icon={User}>
                                        Toggle Personal Tasks Mode
                                    </CommandItem>
                                </Command.Group>

                                <Command.Group heading="Data Management" className="text-xs font-semibold text-text-muted px-2 py-1.5 mt-2">
                                    <CommandItem onSelect={() => runCommand(exportData)} icon={Download}>
                                        Export Data (Backup)
                                    </CommandItem>
                                    <CommandItem onSelect={() => runCommand(() => navigate('/settings?tab=import'))} icon={Upload}>
                                        Import Data (Restore)
                                    </CommandItem>
                                    <CommandItem onSelect={() => runCommand(() => navigate('/recycle-bin'))} icon={Trash2}>
                                        Open Recycle Bin
                                    </CommandItem>
                                </Command.Group>

                                <Command.Group heading="Help" className="text-xs font-semibold text-text-muted px-2 py-1.5 mt-2">
                                    <CommandItem onSelect={() => runCommand(() => navigate('/shortcuts'))} icon={HelpCircle} shortcut="?">
                                        Keyboard Shortcuts
                                    </CommandItem>
                                </Command.Group>
                            </>
                        )}

                        {/* Helper text when empty */}
                        {!isCommandMode && !search && searchResults.length === 0 && (
                            <div className="px-4 py-6 text-center text-sm text-text-muted">
                                <p className="mb-2">Start typing to search across tasks, notes, snippets...</p>
                                <p className="text-xs">Or type <kbd className="kbd mx-1">&gt;</kbd> to browse commands</p>
                            </div>
                        )}
                    </Command.List>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-text-muted bg-background">
                        <div className="flex items-center gap-3">
                            <span><kbd className="kbd">↑↓</kbd> Navigate</span>
                            <span><kbd className="kbd">↵</kbd> Select</span>
                            <span><kbd className="kbd">ESC</kbd> Close</span>
                        </div>
                        {!isCommandMode && searchResults.length > 0 && (
                            <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
                        )}
                    </div>
                </Command>
            </div>
        </div>
    );
}

interface CommandItemProps {
    children: React.ReactNode;
    onSelect: () => void;
    icon?: any;
    iconColor?: string;
    shortcut?: string;
}

function CommandItem({ children, onSelect, icon: Icon, iconColor, shortcut }: CommandItemProps) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary aria-selected:bg-accent-blue/10 aria-selected:text-accent-blue cursor-pointer transition-colors"
        >
            {Icon && <Icon size={16} className={iconColor || ''} />}
            <span className="flex-1">{children}</span>
            {shortcut && (
                <kbd className="px-1.5 py-0.5 text-xs text-text-muted border border-border rounded bg-background-elevated">
                    {shortcut}
                </kbd>
            )}
        </Command.Item>
    );
}

// Helper function to strip HTML tags
function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}
