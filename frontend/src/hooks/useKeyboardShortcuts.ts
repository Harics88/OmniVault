import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
    const navigate = useNavigate();

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modKey = isMac ? event.metaKey : event.ctrlKey;

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

        // Navigation shortcuts
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
    }, [navigate]);

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
