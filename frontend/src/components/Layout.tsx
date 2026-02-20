import { Outlet } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import NoteSwitcher from './NoteSwitcher';
import PomodoroTimer from './PomodoroTimer';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useState, useEffect } from 'react';
import ShortcutsModal from './ShortcutsModal';
import OfflineBanner from './OfflineBanner';

export default function Layout() {
    // Initialize keyboard shortcuts
    useKeyboardShortcuts();

    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [isTooNarrow, setIsTooNarrow] = useState(window.innerWidth < 800);

    useEffect(() => {
        const handleResize = () => setIsTooNarrow(window.innerWidth < 800);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                setIsShortcutsOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Trigger Command Palette instead of Search Modal
    const handleSearchClick = () => {
        const event = new KeyboardEvent('keydown', {
            key: 'k',
            metaKey: true,
            ctrlKey: true, // fallback
            bubbles: true
        });
        document.dispatchEvent(event);
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            {isTooNarrow && (
                <div className="fixed inset-0 z-[1001] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-accent-amber/10 rounded-2xl flex items-center justify-center mb-6 border border-accent-amber/20">
                        <span className="text-3xl">📏</span>
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Window too narrow</h2>
                    <p className="text-text-muted max-w-xs mx-auto">
                        This application is optimized for larger screens. Please expand your window for the best experience.
                    </p>
                    <button
                        onClick={() => setIsTooNarrow(false)}
                        className="mt-8 text-xs text-accent-blue hover:underline"
                    >
                        Continue anyway (may look broken)
                    </button>
                </div>
            )}

            {/* Skip to Content */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only fixed top-4 left-4 z-[200] bg-accent-blue text-white px-4 py-2 rounded-lg shadow-elevated transition-all"
            >
                Skip to content
            </a>

            {/* Sidebar */}
            <ErrorBoundary>
                <Sidebar onSearchClick={handleSearchClick} />
            </ErrorBoundary>

            <OfflineBanner />

            {/* Main Content Area */}
            <main id="main-content" className="flex-1 overflow-auto focus:outline-none" tabIndex={-1}>
                <div className="min-h-full">
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </div>
            </main>

            {/* Command Palette (replaces Search Modal) */}
            <CommandPalette />
            <NoteSwitcher />

            {/* Floating Widgets */}
            <PomodoroTimer />

            {/* Shortcuts help */}
            <ShortcutsModal
                isOpen={isShortcutsOpen}
                onClose={() => setIsShortcutsOpen(false)}
            />
        </div>
    );
}
