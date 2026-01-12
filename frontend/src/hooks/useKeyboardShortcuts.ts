import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
    const navigate = useNavigate();
    const [lastKey, setLastKey] = useState<{ key: string, time: number } | null>(null);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Ignore if input/textarea is focused
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName) || (event.target as HTMLElement).isContentEditable) {
            return;
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modKey = isMac ? event.metaKey : event.ctrlKey;
        const now = Date.now();

        // Single Key Shortcuts (when no modifier)
        if (!modKey && !event.shiftKey && !event.altKey) {
            // '/' for Search
            if (event.key === '/') {
                event.preventDefault();
                window.dispatchEvent(new CustomEvent('open-search'));
                return;
            }

            // 'c' for Create (Generic)
            if (event.key === 'c') {
                // If on tasks page, might trigger new task.
                // For now, let's make it smart based on route, or open command palette
                // window.dispatchEvent(new CustomEvent('open-command-palette'));
                return;
            }

            // '?' for Help
            if (event.key === '?') {
                 navigate('/shortcuts');
                 return;
            }

            // G-Chord Navigation (g then ...)
            if (event.key === 'g') {
                setLastKey({ key: 'g', time: now });
                return;
            }

            // Check for chords
            if (lastKey && lastKey.key === 'g' && (now - lastKey.time) < 1000) {
                setLastKey(null); // Reset
                switch (event.key) {
                    case 'h': navigate('/'); return;
                    case 't': navigate('/tasks'); return;
                    case 'n': navigate('/notes'); return;
                    case 's': navigate('/snippets'); return;
                    case 'b': navigate('/bookmarks'); return;
                    case 'd': navigate('/daily-log'); return;
                }
            }
        }

        // Original Modifier Shortcuts (Keep for backward compat)

        // Cmd/Ctrl + D - Go to today's daily log
        if (modKey && event.key === 'd') {
            event.preventDefault();
            navigate('/daily-log');
        }

        // Cmd/Ctrl + K - Open search (implemented via SearchModal)
        if (modKey && event.key === 'k') {
            event.preventDefault();
            // Dispatch custom event for search modal
            window.dispatchEvent(new CustomEvent('open-search'));
        }

        // Cmd/Ctrl + Shift + C - Create new snippet
        if (modKey && event.shiftKey && event.key === 'C') {
            event.preventDefault();
            window.dispatchEvent(new CustomEvent('create-snippet'));
        }

        // Cmd/Ctrl + Enter - Create task from current line (in daily log)
        if (modKey && event.key === 'Enter') {
            // This will be handled by the DailyLog component
            window.dispatchEvent(new CustomEvent('create-task-from-line'));
        }

        // Escape - Close modals/panels
        if (event.key === 'Escape') {
            window.dispatchEvent(new CustomEvent('close-modal'));
        }

        // Navigation shortcuts (Legacy)
        if (modKey && event.shiftKey) {
            switch (event.key) {
                case 'H':
                    event.preventDefault();
                    navigate('/');
                    break;
                case 'T':
                    event.preventDefault();
                    navigate('/tasks');
                    break;
                case 'N':
                    event.preventDefault();
                    navigate('/notes');
                    break;
                case 'S':
                    event.preventDefault();
                    navigate('/snippets');
                    break;
                case 'B':
                    event.preventDefault();
                    navigate('/bookmarks');
                    break;
            }
        }
    }, [navigate, lastKey]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

// Hook for auto-save functionality
export function useAutoSave(
    content: string,
    saveFunction: (content: string) => Promise<void>,
    delay = 1000
) {
    useEffect(() => {
        const timer = setTimeout(() => {
            if (content) {
                saveFunction(content);
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [content, saveFunction, delay]);
}

// Hook for debouncing
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

import { useState } from 'react';
