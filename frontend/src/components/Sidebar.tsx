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
    Server,
    ChevronLeft,
    ChevronRight,
    Activity,
    Cloud,
    CloudOff
} from 'lucide-react'; import { useState, useEffect } from 'react';
import axios from 'axios';

interface SidebarProps {
    onSearchClick: () => void;
}

const navItems = [
    { to: '/', icon: Home, label: 'Home', shortcut: 'g h', color: 'text-indigo-500' },
    { to: '/timeline', icon: Activity, label: 'Timeline', shortcut: 'g l', color: 'text-sky-500' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks', shortcut: 'g t', color: 'text-emerald-500' },
    { to: '/daily-log', icon: Calendar, label: 'Daily Log', shortcut: 'g d', color: 'text-amber-500' },
    { to: '/notes', icon: FileText, label: 'Notes', shortcut: 'g n', color: 'text-purple-500' },
    { to: '/snippets', icon: Code, label: 'Snippets', shortcut: 'g s', color: 'text-sky-500' },
    { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks', shortcut: 'g b', color: 'text-rose-500' },
    { to: '/registry', icon: Server, label: 'Registry', shortcut: 'g r', color: 'text-amber-500' },
    { to: '/vault', icon: HardDrive, label: 'Vault', shortcut: 'g v', color: 'text-cyan-500' },
];

export default function Sidebar({ onSearchClick }: SidebarProps) {
    const location = useLocation();
    const [dbSize, setDbSize] = useState<string>('Loading...');
    const [appVersion, setAppVersion] = useState<string>('v2.6.3');
    const [isCollapsed, setIsCollapsed] = useState(() => {

        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/system/stats');
                setDbSize(response.data.database_size_human);
                if (response.data.version) {
                    setAppVersion(`v${response.data.version}`);
                }
            } catch (error) {

                console.error('Failed to fetch system stats:', error);
                setDbSize('Unknown');
            }
        };
        fetchStats();
    }, []);

    // Keyboard shortcut to toggle sidebar (Ctrl+B/Cmd+B) - only if not in an input
    useEffect(() => {
        const handleKeyboard = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                const target = e.target as HTMLElement;
                const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
                    target.isContentEditable ||
                    target.closest('.ProseMirror');

                if (!isInput) {
                    e.preventDefault();
                    toggleSidebar();
                }
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
                        <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 whitespace-nowrap">
                                Omni Vault
                            </span>
                            <div className="flex-shrink-0 ml-2 cursor-help">
                                {isOnline ? (
                                    <div title="Online"><Cloud size={14} className="text-accent-green opacity-50" /></div>
                                ) : (
                                    <div title="Offline"><CloudOff size={14} className="text-accent-red" /></div>
                                )}
                            </div>
                        </div>
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
                    <span className="text-xs text-text-muted">{appVersion}</span>
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
