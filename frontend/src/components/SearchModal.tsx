import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, CheckSquare, Code, Bookmark, X, Calendar } from 'lucide-react';
import { searchApi } from '../lib/api';
import type { SearchResult } from '../types';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const typeIcons = {
    task: CheckSquare,
    note: FileText,
    snippet: Code,
    bookmark: Bookmark,
    daily_log: Calendar,
};

const typeColors = {
    task: 'text-accent-amber',
    note: 'text-accent-blue',
    snippet: 'text-accent-green',
    bookmark: 'text-purple-400',
    daily_log: 'text-text-secondary',
};

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const searchItems = async () => {
            if (query.length < 1) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await searchApi.search(query);
                setResults(response.results);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(searchItems, 200);
        return () => clearTimeout(timer);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results.length > 0) {
            e.preventDefault();
            navigateToResult(results[selectedIndex]);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const navigateToResult = (result: SearchResult) => {
        const routes = {
            task: `/tasks`,
            note: `/notes/${result.id}`,
            snippet: `/snippets/${result.id}`,
            bookmark: `/bookmarks`,
            daily_log: `/daily-log`,
        };
        navigate(routes[result.type]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-2xl bg-background-card rounded-xl shadow-elevated border border-border overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                    <Search size={20} className="text-text-muted" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search tasks, notes, snippets, bookmarks..."
                        className="flex-1 bg-transparent text-text-primary placeholder-text-muted text-lg focus:outline-none"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 hover:bg-background-hover rounded transition-colors"
                        >
                            <X size={16} className="text-text-muted" />
                        </button>
                    )}
                    <span className="text-xs text-text-muted">ESC</span>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {isLoading && (
                        <div className="px-4 py-8 text-center text-text-muted">
                            <div className="inline-block w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!isLoading && results.length === 0 && query && (
                        <div className="px-4 py-8 text-center text-text-muted">
                            No results found for "{query}"
                        </div>
                    )}

                    {!isLoading && results.length === 0 && !query && (
                        <div className="px-4 py-8 text-center text-text-muted">
                            <p className="mb-2">Start typing to search</p>
                            <div className="flex items-center justify-center gap-4 text-xs">
                                <span><kbd className="kbd">↑↓</kbd> Navigate</span>
                                <span><kbd className="kbd">↵</kbd> Open</span>
                                <span><kbd className="kbd">esc</kbd> Close</span>
                            </div>
                        </div>
                    )}

                    {!isLoading && results.map((result, index) => {
                        const Icon = typeIcons[result.type];
                        const colorClass = typeColors[result.type];

                        return (
                            <button
                                key={`${result.type}-${result.id}`}
                                onClick={() => navigateToResult(result)}
                                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${index === selectedIndex
                                        ? 'bg-accent-blue/10 border-l-2 border-accent-blue'
                                        : 'hover:bg-background-hover border-l-2 border-transparent'
                                    }`}
                            >
                                <Icon size={18} className={`mt-0.5 ${colorClass}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-text-primary truncate">{result.title}</p>
                                    <p className="text-sm text-text-muted truncate">{result.preview}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded ${colorClass} bg-background`}>
                                    {result.type.replace('_', ' ')}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <CheckSquare size={12} className="text-accent-amber" /> Tasks
                        </span>
                        <span className="flex items-center gap-1">
                            <FileText size={12} className="text-accent-blue" /> Notes
                        </span>
                        <span className="flex items-center gap-1">
                            <Code size={12} className="text-accent-green" /> Snippets
                        </span>
                        <span className="flex items-center gap-1">
                            <Bookmark size={12} className="text-purple-400" /> Bookmarks
                        </span>
                    </div>
                    <span>
                        {results.length} result{results.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        </div>
    );
}
