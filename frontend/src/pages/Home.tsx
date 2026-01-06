import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Calendar,
    CheckSquare,
    FileText,
    Code,
    Bookmark,
    ArrowRight,
    Clock,
    Sparkles,
} from 'lucide-react';
import { dailyLogsApi, tasksApi, notesApi, snippetsApi, bookmarksApi, systemApi } from '../lib/api';
import TaskCard from '../components/TaskCard';

export default function Home() {
    const today = new Date();
    const greeting = getGreeting();
    const navigate = useNavigate();

    // Fetch data
    const { data: todayLog } = useQuery({
        queryKey: ['daily-log', 'today'],
        queryFn: dailyLogsApi.getToday,
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => tasksApi.getAll(),
    });

    const { data: systemStats } = useQuery({
        queryKey: ['system', 'stats'],
        queryFn: systemApi.getStats,
    });

    const { data: recentNotes = [] } = useQuery({
        queryKey: ['notes', 'recent'],
        queryFn: () => notesApi.getRecent(5),
    });

    const { data: recentSnippets = [] } = useQuery({
        queryKey: ['snippets', 'recent'],
        queryFn: () => snippetsApi.getRecent(5),
    });

    const { data: recentBookmarks = [] } = useQuery({
        queryKey: ['bookmarks', 'recent'],
        queryFn: () => bookmarksApi.getRecent(5),
    });

    const activeTasks = tasks.filter((t) => t.status !== 'done').slice(0, 5);

    const ensureAbsoluteUrl = (url: string) => {
        if (!url) return '#';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    const formatSafeDate = (dateStr: string) => {
        if (!dateStr) return '--';
        const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
        return format(date, 'MMM d, h:mm a');
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-2 text-accent-blue mb-2">
                    <Sparkles size={20} />
                    <span className="text-sm font-medium">{format(today, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                    {greeting}, Welcome Back
                </h1>
                <p className="text-text-secondary">
                    Here's what's happening with your workspace today.
                </p>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={CheckSquare}
                    label="Active Tasks"
                    value={activeTasks.length}
                    color="text-emerald-500"
                />
                <StatCard
                    icon={FileText}
                    label="Notes"
                    value={systemStats?.counts.notes || 0}
                    color="text-purple-500"
                />
                <StatCard
                    icon={Code}
                    label="Snippets"
                    value={systemStats?.counts.snippets || 0}
                    color="text-sky-500"
                />
                <StatCard
                    icon={Bookmark}
                    label="Bookmarks"
                    value={systemStats?.counts.bookmarks || 0}
                    color="text-rose-500"
                />
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Today's Log */}
                <div className="col-span-2">
                    <SectionHeader
                        icon={Calendar}
                        title="Today's Log"
                        linkTo="/daily-log"
                        linkLabel="Open Editor"
                        iconColor="text-amber-500"
                    />
                    <div className="card p-6 min-h-[200px] max-h-[300px] overflow-y-auto">
                        {todayLog?.content ? (
                            <div
                                className="prose prose-invert max-w-none text-text-primary"
                                dangerouslySetInnerHTML={{
                                    __html: todayLog.content.slice(0, 800) + (todayLog.content.length > 800 ? '...' : '')
                                }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-text-muted">
                                <Calendar size={32} className="mb-3 opacity-50" />
                                <p className="mb-1">No entries yet for today</p>
                                <p className="text-xs text-text-muted mb-3">Start documenting your day</p>
                                <Link
                                    to="/daily-log"
                                    className="px-4 py-2 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-colors text-sm flex items-center gap-2"
                                >
                                    <Calendar size={16} />
                                    Start writing
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Tasks */}
                <div>
                    <SectionHeader
                        icon={CheckSquare}
                        title="Active Tasks"
                        linkTo="/tasks"
                        linkLabel="View All"
                        count={activeTasks.length}
                        iconColor="text-emerald-500"
                    />
                    <div className="space-y-3">
                        {activeTasks.length > 0 ? (
                            activeTasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                    onStatusChange={() => { }}
                                    isCompact={true}
                                />
                            ))
                        ) : (
                            <div className="card p-6 text-center text-text-muted">
                                <CheckSquare size={24} className="mx-auto mb-2 opacity-50" />
                                <p className="mb-1">No active tasks</p>
                                <p className="text-xs text-text-muted mb-3">All caught up!</p>
                                <Link
                                    to="/tasks"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm"
                                >
                                    <CheckSquare size={16} />
                                    Create Task
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Access Section */}
            <div className="mt-8 grid grid-cols-3 gap-6">
                {/* Recent Notes */}
                <div>
                    <SectionHeader
                        icon={FileText}
                        title="Recent Notes"
                        linkTo="/notes"
                        linkLabel="View All"
                        iconColor="text-purple-500"
                    />
                    <div className="space-y-2">
                        {recentNotes.length > 0 ? (
                            recentNotes.slice(0, 4).map((note) => (
                                <Link
                                    key={note.id}
                                    to={`/notes/${note.id}`}
                                    className="card card-hover p-3 block group"
                                >
                                    <h4 className="font-medium text-text-primary truncate group-hover:text-accent-blue transition-colors">
                                        {note.title}
                                    </h4>
                                    <p className="text-xs text-text-muted mt-1">
                                        {formatSafeDate(note.updated_at)}
                                    </p>
                                </Link>
                            ))
                        ) : (
                            <div className="card p-6 text-center text-text-muted">
                                <FileText size={24} className="mx-auto mb-2 opacity-50 text-purple-500" />
                                <p className="text-sm mb-3">No notes yet</p>
                                <Link
                                    to="/notes"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-colors text-xs"
                                >
                                    <FileText size={14} />
                                    Create Note
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Snippets */}
                <div>
                    <SectionHeader
                        icon={Code}
                        title="Recent Snippets"
                        linkTo="/snippets"
                        linkLabel="View All"
                        iconColor="text-sky-500"
                    />
                    <div className="space-y-2">
                        {recentSnippets.length > 0 ? (
                            recentSnippets.slice(0, 4).map((snippet) => (
                                <Link
                                    key={snippet.id}
                                    to={`/snippets/${snippet.id}`}
                                    className="card card-hover p-3 block group"
                                >
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-text-primary truncate flex-1 group-hover:text-accent-blue transition-colors">
                                            {snippet.title}
                                        </h4>
                                        <span className="badge badge-blue">{snippet.language}</span>
                                    </div>
                                    <p className="text-xs text-text-muted mt-1">
                                        {formatSafeDate(snippet.updated_at)}
                                    </p>
                                </Link>
                            ))
                        ) : (
                            <div className="card p-6 text-center text-text-muted">
                                <Code size={24} className="mx-auto mb-2 opacity-50 text-sky-500" />
                                <p className="text-sm mb-3">No snippets yet</p>
                                <Link
                                    to="/snippets"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 text-sky-500 rounded-lg hover:bg-sky-500/20 transition-colors text-xs"
                                >
                                    <Code size={14} />
                                    Create Snippet
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Bookmarks */}
                <div>
                    <SectionHeader
                        icon={Bookmark}
                        title="Recent Bookmarks"
                        linkTo="/bookmarks"
                        linkLabel="View All"
                        iconColor="text-rose-500"
                    />
                    <div className="space-y-2">
                        {recentBookmarks.length > 0 ? (
                            recentBookmarks.slice(0, 4).map((bookmark) => (
                                <a
                                    key={bookmark.id}
                                    href={ensureAbsoluteUrl(bookmark.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="card card-hover p-3 block group"
                                >
                                    <h4 className="font-medium text-text-primary truncate group-hover:text-accent-blue transition-colors">
                                        {bookmark.title}
                                    </h4>
                                    <p className="text-xs text-text-muted mt-1 truncate">
                                        {bookmark.url}
                                    </p>
                                </a>
                            ))
                        ) : (
                            <div className="card p-6 text-center text-text-muted">
                                <Bookmark size={24} className="mx-auto mb-2 opacity-50 text-rose-500" />
                                <p className="text-sm mb-3">No bookmarks yet</p>
                                <Link
                                    to="/bookmarks"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition-colors text-xs"
                                >
                                    <Bookmark size={14} />
                                    Add Bookmark
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="mt-12 p-4 card bg-gradient-to-r from-background-card to-background-elevated">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-text-primary mb-1">Quick Actions</h3>
                        <p className="text-sm text-text-muted">Use keyboard shortcuts to navigate faster</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-2">
                            <kbd className="kbd">⌘D</kbd>
                            <span className="text-text-muted">Daily Log</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <kbd className="kbd">⌘K</kbd>
                            <span className="text-text-muted">Search</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <kbd className="kbd">⌘⇧C</kbd>
                            <span className="text-text-muted">New Snippet</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Components

function SectionHeader({
    icon: Icon,
    title,
    linkTo,
    linkLabel,
    count,
    iconColor = 'text-accent-blue',
}: {
    icon: typeof Calendar;
    title: string;
    linkTo: string;
    linkLabel: string;
    count?: number;
    iconColor?: string;
}) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Icon size={18} className={iconColor} />
                <h2 className="font-semibold text-text-primary">{title}</h2>
                {count !== undefined && (
                    <span className="text-xs text-text-muted">({count})</span>
                )}
            </div>
            <Link
                to={linkTo}
                className="text-sm text-accent-blue hover:underline flex items-center gap-1"
            >
                {linkLabel} <ArrowRight size={14} />
            </Link>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: typeof Calendar;
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="card p-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-background ${color}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-text-primary">{value}</p>
                    <p className="text-sm text-text-muted">{label}</p>
                </div>
            </div>
        </div>
    );
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}
