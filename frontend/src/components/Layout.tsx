import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import PomodoroTimer from './PomodoroTimer';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export default function Layout() {
    // Initialize keyboard shortcuts
    useKeyboardShortcuts();

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
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar */}
            <Sidebar onSearchClick={handleSearchClick} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                <div className="min-h-full">
                    <Outlet />
                </div>
            </main>

            {/* Command Palette (replaces Search Modal) */}
            <CommandPalette />

            {/* Floating Widgets */}
            <PomodoroTimer />
        </div>
    );
}
