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
} from 'lucide-react';

interface SidebarProps {
    onSearchClick: () => void;
}

const navItems = [
    { to: '/', icon: Home, label: 'Home', shortcut: '⌘⇧H' },
    { to: '/daily-log', icon: Calendar, label: 'Daily Log', shortcut: '⌘D' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks', shortcut: '⌘⇧T' },
    { to: '/notes', icon: FileText, label: 'Notes', shortcut: '⌘⇧N' },
    { to: '/snippets', icon: Code, label: 'Snippets', shortcut: '⌘⇧S' },
    { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks', shortcut: '⌘⇧B' },
];

export default function Sidebar({ onSearchClick }: SidebarProps) {
    const location = useLocation();

    return (
        <aside className="w-60 bg-background-card border-r border-border flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <span className="font-semibold text-lg text-text-primary">MyTasker</span>
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
                            <Icon size={20} />
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
                <button className="sidebar-item w-full group">
                    <Keyboard size={20} />
                    <span className="flex-1 text-left">Shortcuts</span>
                </button>
                <button className="sidebar-item w-full group">
                    <Settings size={20} />
                    <span className="flex-1 text-left">Settings</span>
                </button>
            </div>

            {/* Version */}
            <div className="p-4 text-center">
                <span className="text-xs text-text-muted">v1.0.0</span>
            </div>
        </aside>
    );
}
