import React, { useState, useMemo } from 'react';
import { format, subDays, startOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import {
    Calendar as CalendarIcon,
    Briefcase,
    Users,
    AlertCircle,
    MessageSquare,
    Lightbulb,
    Server,
    Database,
    FolderKanban,
    ChevronLeft,
    ChevronRight,
    Filter,
    X
} from 'lucide-react';
import type { LogEntryType, Entity, DailyLog } from '../types';

interface ActivitySidebarProps {
    logs: DailyLog[];
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    activeTypeFilters: Set<LogEntryType>;
    onToggleTypeFilter: (type: LogEntryType) => void;
    activeEntityFilter: Entity | null;
    onEntityFilter: (entity: Entity | null) => void;
    recentEntities: Entity[];
}

const typeFilters: { type: LogEntryType; icon: React.ElementType; label: string }[] = [
    { type: 'work', icon: Briefcase, label: 'Work' },
    { type: 'meeting', icon: Users, label: 'Meetings' },
    { type: 'issue', icon: AlertCircle, label: 'Issues' },
    { type: 'note', icon: MessageSquare, label: 'Notes' },
    { type: 'idea', icon: Lightbulb, label: 'Ideas' },
];

const entityIcons: Record<string, React.ElementType> = {
    server: Server,
    database: Database,
    project: FolderKanban,
};

export const ActivitySidebar: React.FC<ActivitySidebarProps> = ({
    logs,
    selectedDate,
    onSelectDate,
    activeTypeFilters,
    onToggleTypeFilter,
    activeEntityFilter,
    onEntityFilter,
    recentEntities
}) => {
    const [heatmapOffset, setHeatmapOffset] = useState(0);

    // Generate heatmap data for last 12 weeks
    const heatmapData = useMemo(() => {
        const endDate = subDays(new Date(), heatmapOffset * 7);
        const startDate = subDays(endDate, 84); // 12 weeks

        const days = eachDayOfInterval({ start: startDate, end: endDate });

        // Create a map of date -> entry count
        const entryCounts = new Map<string, number>();
        logs.forEach(log => {
            const count = log.log_entries?.length || 0;
            entryCounts.set(log.date, count);
        });

        return days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            return {
                date: day,
                dateString: dateStr,
                count: entryCounts.get(dateStr) || 0
            };
        });
    }, [logs, heatmapOffset]);

    // Group by weeks for display
    const weeks = useMemo(() => {
        const result: typeof heatmapData[] = [];
        for (let i = 0; i < heatmapData.length; i += 7) {
            result.push(heatmapData.slice(i, i + 7));
        }
        return result;
    }, [heatmapData]);

    const getHeatmapColor = (count: number): string => {
        if (count === 0) return 'bg-background-hover';
        if (count <= 2) return 'bg-accent-indigo/20';
        if (count <= 5) return 'bg-accent-indigo/40';
        if (count <= 8) return 'bg-accent-indigo/60';
        return 'bg-accent-indigo';
    };

    return (
        <aside className="w-60 flex-shrink-0 space-y-6">
            {/* Calendar Heatmap */}
            <div className="p-4 bg-background-card border border-border rounded-xl">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarIcon size={12} />
                        Activity
                    </h3>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setHeatmapOffset(prev => prev + 1)}
                            className="p-1 rounded hover:bg-background-hover text-text-muted"
                        >
                            <ChevronLeft size={12} />
                        </button>
                        <button
                            onClick={() => setHeatmapOffset(prev => Math.max(0, prev - 1))}
                            disabled={heatmapOffset === 0}
                            className="p-1 rounded hover:bg-background-hover text-text-muted disabled:opacity-30"
                        >
                            <ChevronRight size={12} />
                        </button>
                    </div>
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-0.5">
                    {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="flex flex-col gap-0.5">
                            {week.map((day) => {
                                const isSelected = isSameDay(day.date, selectedDate);
                                return (
                                    <button
                                        key={day.dateString}
                                        onClick={() => onSelectDate(day.date)}
                                        className={`w-3 h-3 rounded-sm transition-all ${getHeatmapColor(day.count)} ${isSelected ? 'ring-1 ring-accent-indigo ring-offset-1 ring-offset-background-card' : ''
                                            }`}
                                        title={`${format(day.date, 'MMM d')}: ${day.count} entries`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-1 mt-2">
                    <span className="text-[9px] text-text-muted mr-1">Less</span>
                    <div className="w-2 h-2 rounded-sm bg-background-hover" />
                    <div className="w-2 h-2 rounded-sm bg-accent-indigo/20" />
                    <div className="w-2 h-2 rounded-sm bg-accent-indigo/40" />
                    <div className="w-2 h-2 rounded-sm bg-accent-indigo/60" />
                    <div className="w-2 h-2 rounded-sm bg-accent-indigo" />
                    <span className="text-[9px] text-text-muted ml-1">More</span>
                </div>
            </div>

            {/* Type Filters */}
            <div className="p-4 bg-background-card border border-border rounded-xl">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Filter size={12} />
                    Entry Types
                </h3>
                <div className="space-y-1">
                    {typeFilters.map(filter => {
                        const Icon = filter.icon;
                        const isActive = activeTypeFilters.has(filter.type);
                        return (
                            <button
                                key={filter.type}
                                onClick={() => onToggleTypeFilter(filter.type)}
                                className={`filter-btn w-full ${isActive ? 'filter-btn-active' : ''}`}
                            >
                                <Icon size={14} />
                                <span className="flex-1 text-left">{filter.label}</span>
                                {isActive && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-indigo" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Recent Entities */}
            {recentEntities.length > 0 && (
                <div className="p-4 bg-background-card border border-border rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Recent Entities
                        </h3>
                        {activeEntityFilter && (
                            <button
                                onClick={() => onEntityFilter(null)}
                                className="p-1 rounded hover:bg-background-hover text-text-muted hover:text-accent-red"
                                title="Clear filter"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                    <div className="space-y-1">
                        {recentEntities.slice(0, 6).map(entity => {
                            const Icon = entityIcons[entity.type] || Server;
                            const isActive = activeEntityFilter?.id === entity.id;
                            return (
                                <button
                                    key={entity.id}
                                    onClick={() => onEntityFilter(isActive ? null : entity)}
                                    className={`filter-btn w-full ${isActive ? 'filter-btn-active bg-accent-indigo/10 text-accent-indigo' : ''}`}
                                >
                                    <Icon size={14} />
                                    <span className="flex-1 text-left truncate">{entity.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Keyboard shortcuts hint */}
            <div className="p-3 bg-background-elevated/50 border border-border-subtle rounded-lg">
                <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Shortcuts
                </h4>
                <div className="space-y-1.5 text-[10px] text-text-muted">
                    <div className="flex items-center justify-between">
                        <span>New entry</span>
                        <span className="kbd">N</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Search</span>
                        <span className="kbd">/</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Today</span>
                        <span className="kbd">T</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default ActivitySidebar;
