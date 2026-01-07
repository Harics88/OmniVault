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
    Layers,
    Check,
    Trash2,
    HardDrive
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
];

export default function Sidebar({ onSearchClick }: SidebarProps) {
    const location = useLocation();
    const [dbSize, setDbSize] = useState<string>('Loading...');

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

    return (
        <aside className="w-60 bg-background-card border-r border-border flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <img src="/omnivault-logo.png" alt="Omni Vault Logo" className="w-8 h-8 rounded-lg shadow-sm" />
                    <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                        Omni Vault
                    </span>
                </div>
            </div>

            {/* Search Button */}
            <div className="p-3">
                <button
                    onClick={onSearchClick}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-background hover:bg-background-hover rounded-lg text-text-secondary hover:text-text-primary transition-all duration-150 group"
                >
                    <Search size={18} />
                    <span className="flex-1 text-left text-sm">Search...</span>
                    <span className="text-xs text-text-muted group-hover:text-text-secondary">⌘K</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to ||
                        (item.to !== '/' && location.pathname.startsWith(item.to));

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={`sidebar-item group ${isActive ? 'active' : ''}`}
                        >
                            <Icon
                                size={20}
                                className={`transition-colors ${isActive ? 'text-text-primary' : item.color} group-hover:text-text-primary`}
                            />
                            <span className="flex-1">{item.label}</span>
                            <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.shortcut}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-3 border-t border-border space-y-1">
                <NavLink
                    to="/recycle-bin"
                    className={({ isActive }) => `sidebar-item w-full group ${isActive ? 'active' : ''}`}
                >
                    <Trash2 size={20} className="text-slate-400 group-hover:text-text-primary transition-colors" />
                    <span className="flex-1 text-left">Recycle Bin</span>
                </NavLink>
                <NavLink
                    to="/shortcuts"
                    className={({ isActive }) => `sidebar-item w-full group ${isActive ? 'active' : ''}`}
                >
                    <Keyboard size={20} className="text-slate-400 group-hover:text-text-primary transition-colors" />
                    <span className="flex-1 text-left">Shortcuts</span>
                </NavLink>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `sidebar-item w-full group ${isActive ? 'active' : ''}`}
                >
                    <Settings size={20} className="text-slate-400 group-hover:text-text-primary transition-colors" />
                    <span className="flex-1 text-left">Settings</span>
                </NavLink>
            </div>

            {/* Data Storage Section */}
            <div className="px-3 pb-1">
                <div className="flex items-center gap-3 px-3 py-2 text-text-muted">
                    <HardDrive size={20} className="text-slate-400" />
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Storage</span>
                        <span className="text-xs font-mono text-accent-green">{dbSize}</span>
                    </div>
                </div>
            </div>

            {/* Version */}
            <div className="p-4 pt-0 text-center">
                <span className="text-xs text-text-muted">v1.0.0</span>
            </div>
        </aside>
    );
}
