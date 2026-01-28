import { NavLink, useLocation } from 'react-router-dom';
import {
    Home,
    Calendar,
    CheckSquare,
    FileText,
    Code,
    Bookmark,
    Search,
    Settings,
    Keyboard,
    Trash2,
    HardDrive,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface SidebarProps {
    onSearchClick: () => void;
}

const navItems = [
    { to: '/', icon: Home, label: 'Home', shortcut: '⌘⇧H', color: 'text-indigo-500' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks', shortcut: '⌘⇧T', color: 'text-emerald-500' },
    { to: '/daily-log', icon: Calendar, label: 'Daily Log', shortcut: '⌘D', color: 'text-amber-500' },
    { to: '/notes', icon: FileText, label: 'Notes', shortcut: '⌘⇧N', color: 'text-purple-500' },
    { to: '/snippets', icon: Code, label: 'Snippets', shortcut: '⌘⇧S', color: 'text-sky-500' },
    { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks', shortcut: '⌘⇧B', color: 'text-rose-500' },
    { to: '/vault', icon: HardDrive, label: 'Vault', shortcut: '⌘⇧V', color: 'text-cyan-500' },
];

export default function Sidebar({ onSearchClick }: SidebarProps) {
    const location = useLocation();
    const [dbSize, setDbSize] = useState<string>('Loading...');
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/system/stats');
                setDbSize(response.data.database_size_human);
            } catch (error) {
                console.error('Failed to fetch system stats:', error);
                setDbSize('Unknown');
            }
        };
        fetchStats();
    }, []);

    // Keyboard shortcut to toggle sidebar (Ctrl+B)
    useEffect(() => {
        const handleKeyboard = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                toggleSidebar();
            }
        };

        document.addEventListener('keydown', handleKeyboard);
        return () => document.removeEventListener('keydown', handleKeyboard);
    }, [isCollapsed]);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', String(newState));
        // Dispatch event for other components if needed
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <aside className={`bg-background-card border-r border-border flex flex-col h-full transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-60'}`}>
            {/* Logo */}
            <div className={`p-4 border-b border-border ${isCollapsed ? 'px-2' : ''}`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                    <img
                        src="/omnivault-logo.png"
                        alt="Omni Vault Logo"
                        className="w-8 h-8 rounded-lg shadow-sm flex-shrink-0"
                    />
                    {!isCollapsed && (
                        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 whitespace-nowrap">
                            Omni Vault
                        </span>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <div className={`px-3 pt-3 ${isCollapsed ? 'px-2' : ''}`}>
                <button
                    onClick={toggleSidebar}
                    className={`w-full flex items-center gap-2 px-3 py-2 bg-background-elevated hover:bg-background-hover rounded-lg text-text-muted hover:text-text-primary transition-all duration-150 group ${isCollapsed ? 'justify-center px-2' : ''}`}
                    title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
                >
                    {isCollapsed ? (
                        <ChevronRight size={20} />
                    ) : (
                        <>
                            <ChevronLeft size={18} />
                            <span className="text-xs flex-1 text-left">Collapse</span>
                            <span className="text-xs opacity-50">⌘B</span>
                        </>
                    )}
                </button>
            </div>

            {/* Search Button */}
            <div className={`p-3 ${isCollapsed ? 'px-2' : ''}`}>
                <button
                    onClick={onSearchClick}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 bg-background hover:bg-background-hover rounded-lg text-text-secondary hover:text-text-primary transition-all duration-150 group ${isCollapsed ? 'justify-center px-2' : ''}`}
                    title={isCollapsed ? 'Search (⌘K)' : 'Search...'}
                >
                    <Search size={18} className="flex-shrink-0" />
                    {!isCollapsed && (
                        <>
                            <span className="flex-1 text-left text-sm">Search...</span>
                            <span className="text-xs text-text-muted group-hover:text-text-secondary">⌘K</span>
                        </>
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className={`flex-1 p-3 space-y-1 ${isCollapsed ? 'px-2' : ''}`}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to ||
                        (item.to !== '/' && location.pathname.startsWith(item.to));

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={`sidebar-item group ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-2' : ''}`}
                            title={isCollapsed ? item.label : ''}
                        >
                            <Icon
                                size={20}
                                className={`transition-colors flex-shrink-0 ${isActive ? 'text-text-primary' : item.color} group-hover:text-text-primary`}
                            />
                            {!isCollapsed && (
                                <>
                                    <span className="flex-1">{item.label}</span>
                                    <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.shortcut}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className={`p-3 border-t border-border space-y-1 ${isCollapsed ? 'px-2' : ''}`}>
                <NavLink
                    to="/recycle-bin"
                    className={({ isActive }) => `sidebar-item w-full group ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-2' : ''}`}
                    title={isCollapsed ? 'Recycle Bin' : ''}
                >
                    <Trash2 size={20} className="text-slate-400 group-hover:text-text-primary transition-colors flex-shrink-0" />
                    {!isCollapsed && <span className="flex-1 text-left">Recycle Bin</span>}
                </NavLink>
                <NavLink
                    to="/shortcuts"
                    className={({ isActive }) => `sidebar-item w-full group ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-2' : ''}`}
                    title={isCollapsed ? 'Shortcuts' : ''}
                >
                    <Keyboard size={20} className="text-slate-400 group-hover:text-text-primary transition-colors flex-shrink-0" />
                    {!isCollapsed && <span className="flex-1 text-left">Shortcuts</span>}
                </NavLink>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `sidebar-item w-full group ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-2' : ''}`}
                    title={isCollapsed ? 'Settings' : ''}
                >
                    <Settings size={20} className="text-slate-400 group-hover:text-text-primary transition-colors flex-shrink-0" />
                    {!isCollapsed && <span className="flex-1 text-left">Settings</span>}
                </NavLink>
            </div>

            {/* Data Storage Section */}
            {!isCollapsed && (
                <div className="px-3 pb-1">
                    <div className="flex items-center gap-3 px-3 py-2 text-text-muted">
                        <HardDrive size={20} className="text-slate-400 flex-shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Storage</span>
                            <span className="text-xs font-mono text-accent-green">{dbSize}</span>
                        </div>
                    </div>
                </div>
            )}

            {!isCollapsed && (
                /* Version */
                <div className="p-4 pt-0 text-center">
                    <span className="text-xs text-text-muted">v1.0.0</span>
                </div>
            )}

            {/* Collapsed State Storage Indicator */}
            {isCollapsed && (
                <div className="px-2 pb-2 flex justify-center">
                    <div className="p-2 rounded-lg bg-background-elevated" title={`Storage: ${dbSize}`}>
                        <HardDrive size={16} className="text-accent-green" />
                    </div>
                </div>
            )}
        </aside>
    );
}
