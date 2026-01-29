import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import {
    Calendar,
    CheckSquare,
    FileText,
    Code,
    Bookmark,
    ArrowRight,
    Sparkles,
    Layout,
    Eye,
    EyeOff
} from 'lucide-react';
import { dailyLogsApi, tasksApi, notesApi, snippetsApi, bookmarksApi, systemApi } from '../lib/api';
import TaskCard from '../components/TaskCard';
import ActivityHeatmap from '../components/ActivityHeatmap';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '../components/StrictModeDroppable';
import { loadWidgetConfig, saveWidgetConfig, WidgetConfig } from '../utils/widgetConfig';
import { GripVertical } from 'lucide-react';

export default function Home() {
    const today = new Date();
    const greeting = getGreeting();
    const navigate = useNavigate();
    const [configMode, setConfigMode] = useState(false);
    const [widgets, setWidgets] = useState<WidgetConfig[]>(loadWidgetConfig());

    useEffect(() => {
        saveWidgetConfig(widgets);
    }, [widgets]);

    const toggleWidget = (id: string) => {
        setWidgets(prev => prev.map(w =>
            w.id === id ? { ...w, enabled: !w.enabled } : w
        ));
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(widgets);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update order property
        const updated = items.map((item, index) => ({ ...item, order: index }));
        setWidgets(updated);
    };

    const getSpanClass = (span: string) => {
        switch (span) {
            case 'full': return 'col-span-full';
            case 'two-thirds': return 'lg:col-span-2 col-span-full';
            case 'half': return 'lg:col-span-1.5 col-span-full'; // Custom handling might be needed
            case 'third': return 'lg:col-span-1 col-span-full';
            default: return 'col-span-full';
        }
    };

    // Fetch data
    const { data: todayLog } = useQuery({
        queryKey: ['daily-log', format(today, 'yyyy-MM-dd')],
        queryFn: () => dailyLogsApi.getByDate(format(today, 'yyyy-MM-dd')),
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

    const renderWidget = (id: string) => {
        switch (id) {
            case 'heatmap':
                return <ActivityHeatmap />;
            case 'quickStats':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                );
            case 'todayLog':
                return (
                    <div>
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
                                    <p className="mb-1">No entries found for {format(today, 'MMM d')}</p>
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
                );
            case 'activeTasks':
                return (
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
                                activeTasks.map((task: any) => (
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
                );
            case 'recentNotes':
                return (
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
                                recentNotes.slice(0, 4).map((note: any) => (
                                    <Link
                                        key={note.id}
                                        to={`/notes/${note.id}`}
                                        className="card card-hover p-3 block group"
                                    >
                                        <h4 className="font-medium text-text-primary truncate group-hover:text-accent-blue transition-colors">
                                            {note.title}
                                        </h4>
                                        <p className="text-sm text-text-muted/70 line-clamp-2 mt-1 mb-2">
                                            {note.content ? note.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 100) : 'No content'}
                                        </p>
                                        <p className="text-[10px] text-text-muted mt-auto pt-1 border-t border-border/10">
                                            Last modified {formatSafeDate(note.updated_at)}
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
                );
            case 'recentSnippets':
                return (
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
                                recentSnippets.slice(0, 4).map((snippet: any) => (
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
                );
            case 'recentBookmarks':
                return (
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
                                recentBookmarks.slice(0, 4).map((bookmark: any) => (
                                    <button
                                        key={bookmark.id}
                                        onClick={() => {
                                            if (bookmark.is_file) {
                                                bookmarksApi.open(bookmark.id);
                                            } else {
                                                window.open(ensureAbsoluteUrl(bookmark.url), '_blank', 'noopener,noreferrer');
                                            }
                                        }}
                                        className="card card-hover p-3 block group w-full text-left"
                                    >
                                        <h4 className="font-medium text-text-primary truncate group-hover:text-accent-blue transition-colors">
                                            {bookmark.title}
                                        </h4>
                                        <p className="text-xs text-text-muted mt-1 truncate">
                                            {bookmark.url}
                                        </p>
                                    </button>
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
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            {/* Header */}
            <header className="mb-8 flex items-start justify-between">
                <div>
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
                </div>
                <button
                    onClick={() => setConfigMode(!configMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${configMode ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-accent-blue/20' : 'bg-background-card text-text-muted border-border hover:bg-background-elevated'}`}
                >
                    <Layout size={18} />
                    <span className="text-sm font-bold">Customize</span>
                </button>
            </header>

            {configMode && (
                <div className="mb-8 p-6 bg-background-card border border-border rounded-2xl animate-fade-in shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Dashboard Configuration</h3>
                        <button
                            onClick={() => {
                                localStorage.removeItem('dashboardWidgetConfig');
                                setWidgets(loadWidgetConfig());
                            }}
                            className="text-[10px] font-bold text-accent-blue hover:underline"
                        >
                            Reset Defaults
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {widgets.map(widget => (
                            <button
                                key={widget.id}
                                onClick={() => toggleWidget(widget.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${widget.enabled
                                    ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30'
                                    : 'bg-background-elevated/50 text-text-muted border border-border/50'
                                    }`}
                            >
                                {widget.enabled ? <Eye size={14} className="shrink-0" /> : <EyeOff size={14} className="shrink-0" />}
                                {widget.title}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-text-muted mt-4 italic">
                        * Drag items by the handle to reorder. Toggle visibility using the buttons above.
                    </p>
                </div>
            )}

            <DragDropContext onDragEnd={onDragEnd}>
                <StrictModeDroppable droppableId="dashboard-widgets">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        >
                            {widgets.filter(w => w.enabled).map((widget, index) => (
                                <Draggable key={widget.id} draggableId={widget.id} index={index} isDragDisabled={!configMode}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`${getSpanClass(widget.span)} ${snapshot.isDragging ? 'z-50' : ''}`}
                                            style={{
                                                ...provided.draggableProps.style,
                                                transform: snapshot.isDragging
                                                    ? provided.draggableProps.style?.transform
                                                    : 'none', // Fix for jumping issues in some layouts
                                            }}
                                        >
                                            <div className={`relative group transition-all ${configMode ? 'ring-2 ring-accent-blue/20 rounded-2xl' : ''}`}>
                                                {configMode && (
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="absolute -left-3 top-1/2 -translate-y-1/2 p-1.5 bg-background-card border border-border rounded-lg shadow-lg z-20 cursor-grab active:cursor-grabbing text-text-muted hover:text-accent-blue transition-colors group-hover:opacity-100 opacity-0"
                                                    >
                                                        <GripVertical size={16} />
                                                    </div>
                                                )}
                                                <div className={snapshot.isDragging ? 'opacity-50' : ''}>
                                                    {renderWidget(widget.id)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </StrictModeDroppable>
            </DragDropContext>

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
        <div className="card p-4 border border-border/50 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 hover:border-border transition-all duration-300 group">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br from-background to-background-elevated ${color} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={20} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-text-primary group-hover:text-white transition-colors">{value}</p>
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
