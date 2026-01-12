import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, CheckSquare, FileText, Code, Bookmark, Settings,
    Sun, Plus, Search, Home, Trash2
} from 'lucide-react';

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    const toggleTheme = () => {
        const current = localStorage.getItem('theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', next);
        document.documentElement.classList.toggle('light', next === 'light');
        // Dispatch storage event to sync sidebar state
        window.dispatchEvent(new Event('storage'));
    };

    // If not open, don't render anything to avoid z-index issues
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)}>
            <div
                className="w-full max-w-lg bg-background-card border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <Command className="w-full">
                    <div className="flex items-center border-b border-border px-3">
                        <Search className="w-5 h-5 text-text-muted mr-2" />
                        <Command.Input
                            autoFocus
                            placeholder="Type a command or search..."
                            className="w-full py-4 bg-transparent outline-none text-text-primary placeholder:text-text-muted"
                        />
                    </div>

                    <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
                        <Command.Empty className="py-6 text-center text-sm text-text-muted">
                            No results found.
                        </Command.Empty>

                        <Command.Group heading="Navigation" className="text-xs font-semibold text-text-muted px-2 py-1.5">
                            <CommandItem onSelect={() => runCommand(() => navigate('/'))} icon={Home}>Home</CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate('/daily-log'))} icon={Calendar}>Daily Log</CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate('/tasks'))} icon={CheckSquare}>Tasks</CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate('/notes'))} icon={FileText}>Notes</CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate('/snippets'))} icon={Code}>Snippets</CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate('/bookmarks'))} icon={Bookmark}>Bookmarks</CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate('/settings'))} icon={Settings}>Settings</CommandItem>
                        </Command.Group>

                        <Command.Group heading="Actions" className="text-xs font-semibold text-text-muted px-2 py-1.5 mt-2">
                            <CommandItem onSelect={() => runCommand(() => navigate('/tasks'))} icon={Plus}>Create Task</CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate('/notes'))} icon={Plus}>Create Note</CommandItem>
                            <CommandItem onSelect={() => runCommand(toggleTheme)} icon={Sun}>Toggle Theme</CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate('/recycle-bin'))} icon={Trash2}>Recycle Bin</CommandItem>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}

function CommandItem({ children, onSelect, icon: Icon }: { children: React.ReactNode, onSelect: () => void, icon?: any }) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary aria-selected:bg-accent-blue/10 aria-selected:text-accent-blue cursor-pointer transition-colors"
        >
            {Icon && <Icon size={16} />}
            {children}
        </Command.Item>
    );
}
