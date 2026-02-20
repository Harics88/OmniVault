import { useEffect, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Global keyboard shortcuts hook for MyTasker.
 * Handles navigation chords (g + h, g + t, etc.) and global modifiers.
 */
export function useKeyboardShortcuts() {
    const navigate = useNavigate();
    const location = useLocation();
    const [lastKey, setLastKey] = useState<{ key: string, time: number } | null>(null);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // 1. Ignore if user is typing in an input, textarea, or contentEditable
        const target = event.target as HTMLElement;
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
            target.isContentEditable ||
            target.closest('.ProseMirror'); // Tiptap editor

        if (isInput) {
            // Only allow Cmd/Ctrl + Enter inside editors for task creation
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                window.dispatchEvent(new CustomEvent('create-task-from-line'));
                return;
            }
            return;
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modKey = isMac ? event.metaKey : event.ctrlKey;
        const now = Date.now();

        // 2. Single Key Shortcuts (No modifiers)
        if (!modKey && !event.shiftKey && !event.altKey) {
            // '/' or 'k' for Command Palette (Legacy support, CommandPalette.tsx also handles this)
            if (event.key === '/') {
                // CommandPalette handles its own toggle, we just prevent default if needed
                return;
            }

            // '?' for Help / Shortcuts
            if (event.key === '?') {
                navigate('/shortcuts');
                return;
            }

            // G-Chord Navigation (Gmail/GitHub style: g then h, t, n, etc.)
            if (event.key === 'g') {
                setLastKey({ key: 'g', time: now });
                return;
            }

            // Handle chords
            if (lastKey && lastKey.key === 'g' && (now - lastKey.time) < 1000) {
                setLastKey(null);
                switch (event.key) {
                    case 'h': navigate('/'); return;
                    case 'd': navigate('/daily-log'); return;
                    case 't': navigate('/tasks'); return;
                    case 'n': navigate('/notes'); return;
                    case 's': navigate('/snippets'); return;
                    case 'b': navigate('/bookmarks'); return;
                    case 'v': navigate('/vault'); return;
                    case 'r': navigate('/recycle-bin'); return;
                    case ',': navigate('/settings'); return;
                }
            }
        }

        // 3. Modifier Shortcuts

        // Ctrl/Cmd + K - Command Palette (Primary)
        if (modKey && event.key === 'k') {
            // Handled by CommandPalette.tsx
            return;
        }

        // Alt + D - Quick jump to today (Alternative to Ctrl+D which conflicts with browser bookmark)
        if (event.altKey && event.key === 'd') {
            event.preventDefault();
            navigate('/daily-log');
            return;
        }

        // Alt + N - Quick create new note (Alternative to Ctrl+N which opens new window)
        if (event.altKey && event.key === 'n') {
            event.preventDefault();
            navigate('/notes?new=true');
            return;
        }

        // Escape - Global close / back
        if (event.key === 'Escape') {
            // TaskPopout handle this internally, but we can trigger global clear
            window.dispatchEvent(new CustomEvent('close-modal'));
        }

    }, [navigate, lastKey]);

    // Reset lastKey if too much time passes
    useEffect(() => {
        if (!lastKey) return;
        const timer = setTimeout(() => setLastKey(null), 1000);
        return () => clearTimeout(timer);
    }, [lastKey]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Hook for auto-save functionality
 */
export function useAutoSave(
    content: string,
    saveFunction: (content: string) => Promise<void>,
    delay = 1000
) {
    useEffect(() => {
        if (!content) return;

        const timer = setTimeout(() => {
            saveFunction(content);
        }, delay);

        return () => clearTimeout(timer);
    }, [content, saveFunction, delay]);
}

/**
 * Simple debounce hook
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}
