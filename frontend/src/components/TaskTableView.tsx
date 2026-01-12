import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Circle, Clock, Check, Triangle, Trash2, CheckSquare, Calendar, ArrowRight, Search } from 'lucide-react';
import { format, isPast, subDays } from 'date-fns';
import type { Task, TaskStatus } from '../types';

interface TaskTableViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onStatusChange: (taskId: number, status: TaskStatus) => void;
    onDelete: (taskId: number) => void;
    searchQuery: string;
    showArchived: boolean;
}

const statusConfig = {
    not_started: { label: 'Not Started', icon: Circle, color: 'text-text-muted', bg: 'bg-background-elevated', badge: 'bg-background-elevated/50 text-text-muted border-border/50' },
    in_progress: { label: 'In Progress', icon: Clock, color: 'text-accent-amber', bg: 'bg-accent-amber/10', badge: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20' },
    done: { label: 'Completed', icon: Check, color: 'text-accent-green', bg: 'bg-accent-green/10', badge: 'bg-accent-green/10 text-accent-green border-accent-green/20' },
};

const priorityConfig: Record<string, { color: string, icon: any, className?: string, label: string, bg: string }> = {
    LOW: { color: 'text-blue-400', icon: Triangle, className: 'rotate-180', label: 'Low', bg: 'bg-blue-400/10 border-blue-400/20' },
    MEDIUM: { color: 'text-emerald-400', icon: Circle, label: 'Med', bg: 'bg-emerald-400/10 border-emerald-400/20' },
    HIGH: { color: 'text-orange-400', icon: Triangle, label: 'High', bg: 'bg-orange-400/10 border-orange-400/20' },
};

export default function TaskTableView({
    tasks,
    onTaskClick,
    onStatusChange,
    onDelete,
    searchQuery,
    showArchived
}: TaskTableViewProps) {
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({ archived: true });

    // Filter and Group Logic
    const filteredTasks = useMemo(() => {
        let result = tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());

            const isOldCompleted = (task.status || '').toLowerCase() === 'done' &&
                task.completed_at &&
                isPast(new Date(task.completed_at)) &&
                new Date(task.completed_at) < subDays(new Date(), 14);

            if (!showArchived && isOldCompleted) return false;
            return matchesSearch;
        });

        const groups: Record<string, Task[]> = {
            not_started: [],
            in_progress: [],
            done: [],
            archived: []
        };

        result.forEach(task => {
            const s = (task.status || 'not_started').toLowerCase();
            const isArchived = s === 'done' &&
                task.completed_at &&
                new Date(task.completed_at) < subDays(new Date(), 14);

            if (isArchived) {
                groups.archived.push(task);
            } else if (groups[s]) {
                groups[s].push(task);
            } else {
                groups.not_started.push(task);
            }
        });

        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
                const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
                return dateA - dateB;
            });
        });

        return groups;
    }, [tasks, searchQuery, showArchived]);

    const toggleSection = (section: string) => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const renderRows = (status: string, sectionTasks: Task[]) => {
        if (sectionTasks.length === 0) return null;

        const isArchived = status === 'archived';
        const config = isArchived ? statusConfig.done : (statusConfig as any)[status];
        const isCollapsed = collapsedSections[status];

        return (
            <div key={status} className="mb-6 last:mb-0">
                <div
                    className="flex items-center gap-4 px-6 py-3 bg-background-elevated/40 hover:bg-background-elevated/60 transition-all cursor-pointer border-y border-border/20 sticky top-[48px] z-10 backdrop-blur-md rounded-t-xl"
                    onClick={() => toggleSection(status)}
                >
                    <div className="flex-1 min-w-[400px] max-w-[400px] flex items-center gap-3">
                        <div className={`p-1 rounded-lg ${isArchived ? 'bg-background-elevated' : config.bg} transition-colors`}>
                            {isCollapsed ? <ChevronRight size={14} className="text-text-muted shrink-0" /> : <ChevronDown size={14} className="text-text-muted shrink-0" />}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-[0.15em] ${isArchived ? 'text-text-muted' : 'text-text-primary'}`}>
                            {isArchived ? 'Archived' : config.label}
                        </span>
                        <span className="text-[10px] bg-background-card px-2.5 py-0.5 rounded-full text-text-muted font-bold border border-border/50 shadow-sm">{sectionTasks.length}</span>
                    </div>

                    {/* Column Alignments */}
                    <div className="w-24 shrink-0"></div>
                    <div className="w-48 shrink-0"></div>
                    <div className="w-48 shrink-0"></div>
                    <div className="w-48 shrink-0"></div>
                    <div className="w-32 shrink-0"></div>
                    <div className="w-12 shrink-0"></div>
                </div>

                {!isCollapsed && (
                    <div className="bg-background/20 divide-y divide-border/5 rounded-b-xl border-x border-b border-border/10 overflow-hidden shadow-sm">
                        {sectionTasks.map((task) => {
                            const pKey = (task.priority || 'MEDIUM').toUpperCase();
                            const pStyle = priorityConfig[pKey] || priorityConfig.MEDIUM;

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => onTaskClick(task)}
                                    className={`flex items-center gap-4 px-6 py-3 transition-all group cursor-pointer hover:bg-background-elevated/40 relative active:scale-[0.998]`}
                                >
                                    <div className="flex-1 min-w-[400px] max-w-[400px] overflow-hidden">
                                        <div className="flex items-center gap-3 pl-2">
                                            <span
                                                className={`text-sm font-medium transition-all truncate ${task.status === 'done' ? 'text-text-muted/60 line-through' : 'text-text-primary group-hover:text-accent-blue'}`}
                                                title={task.title.length > 50 ? task.title : undefined}
                                            >
                                                {task.title.length > 50 ? task.title.substring(0, 50) + '...' : task.title}
                                            </span>
                                            {task.subtasks?.length > 0 && (
                                                <div className="flex items-center gap-1 bg-background-elevated/50 px-2 py-0.5 rounded-md border border-border/30 shadow-sm shrink-0">
                                                    <CheckSquare size={10} className="text-accent-green" />
                                                    <span className="text-[10px] font-bold text-text-muted font-mono tracking-tighter">
                                                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Priority Badge */}
                                    <div className="w-24 shrink-0 flex justify-center">
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${pStyle.bg} ${pStyle.color} transition-all`}>
                                            <pStyle.icon size={10} className={pStyle.className} fill="none" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{pStyle.label}</span>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="w-48 flex items-center gap-2 text-[11px] text-text-muted font-medium shrink-0 group-hover:text-text-primary transition-colors">
                                        <Calendar size={12} className="opacity-40" />
                                        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : <span className="opacity-20">No due date</span>}
                                    </div>

                                    <div className="w-48 flex items-center gap-2 text-[11px] text-text-muted font-medium shrink-0 group-hover:text-text-primary transition-colors">
                                        <Clock size={12} className="opacity-40" />
                                        {task.started_at ? format(new Date(task.started_at), 'MMM d, yyyy') : <span className="opacity-20">Not started</span>}
                                    </div>

                                    <div className="w-48 flex items-center gap-2 text-[11px] text-text-muted font-medium shrink-0 group-hover:text-text-primary transition-colors">
                                        <Check size={12} className="opacity-40" />
                                        {task.completed_at ? format(new Date(task.completed_at), 'MMM d, yyyy') : <span className="opacity-20">Unfinished</span>}
                                    </div>

                                    {/* Status Pill */}
                                    <div className="w-32 shrink-0">
                                        <div className="relative group/pill">
                                            <select
                                                value={task.status}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => { e.stopPropagation(); onStatusChange(task.id, e.target.value as TaskStatus); }}
                                                className={`appearance-none bg-background-elevated/40 hover:bg-background-elevated/60 text-[10px] font-bold uppercase tracking-wider ${config.color} border border-border/30 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-accent-blue/30 cursor-pointer w-full transition-all text-center pr-2`}
                                            >
                                                <option value="not_started">Not Started</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="w-12 flex justify-end gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                                            className="p-2 rounded-lg hover:bg-accent-red/10 text-text-muted hover:text-accent-red transition-all shadow-sm active:scale-90"
                                            title="Delete Task"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                        <div className="p-2 text-text-muted/30">
                                            <ArrowRight size={13} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-background-card/30 rounded-2xl border border-border/50 shadow-2xl overflow-hidden flex flex-col h-full backdrop-blur-sm">
            <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="min-w-max">
                    {/* Main Table Header */}
                    <div className="flex items-center gap-4 px-6 py-4 bg-background-card/80 border-b border-border/50 text-[10px] font-black text-text-muted uppercase tracking-[0.25em] sticky top-0 z-20 shrink-0 backdrop-blur-xl">
                        <div className="flex-1 min-w-[400px] max-w-[400px] flex items-center gap-2">
                            <span>Title / Objective</span>
                        </div>
                        <div className="w-24 text-center shrink-0">Priority</div>
                        <div className="w-48 shrink-0">Target Date</div>
                        <div className="w-48 shrink-0">Commenced</div>
                        <div className="w-48 shrink-0">Concluded</div>
                        <div className="w-32 text-center shrink-0">Current Stage</div>
                        <div className="w-12 shrink-0"></div>
                    </div>

                    <div className="p-4 space-y-2">
                        {renderRows('in_progress', filteredTasks.in_progress)}
                        {renderRows('not_started', filteredTasks.not_started)}
                        {renderRows('done', filteredTasks.done)}
                        {renderRows('archived', filteredTasks.archived)}

                        {Object.values(filteredTasks).every(g => g.length === 0) && (
                            <div className="py-24 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-background-elevated rounded-full flex items-center justify-center mb-4 border border-border/50">
                                    <Search size={24} className="text-text-muted" />
                                </div>
                                <h3 className="text-lg font-bold text-text-primary mb-1">No tasks found</h3>
                                <p className="text-sm text-text-muted">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
