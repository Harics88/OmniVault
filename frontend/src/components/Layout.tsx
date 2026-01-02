import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import SearchModal from './SearchModal';
import { useState, useEffect } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export default function Layout() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Initialize keyboard shortcuts
    useKeyboardShortcuts();

    useEffect(() => {
        const handleOpenSearch = () => setIsSearchOpen(true);
        const handleCloseModal = () => setIsSearchOpen(false);

        window.addEventListener('open-search', handleOpenSearch);
        window.addEventListener('close-modal', handleCloseModal);

        return () => {
            window.removeEventListener('open-search', handleOpenSearch);
            window.removeEventListener('close-modal', handleCloseModal);
        };
    }, []);

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar */}
            <Sidebar onSearchClick={() => setIsSearchOpen(true)} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                <div className="min-h-full">
                    <Outlet />
                </div>
            </main>

            {/* Search Modal */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
}
