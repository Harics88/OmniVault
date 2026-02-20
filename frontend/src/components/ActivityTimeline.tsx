import React, { useState, useCallback, useMemo } from 'react';
import { format, isToday, parseISO, startOfDay } from 'date-fns';
import { ChevronDown, ChevronRight, Clock, Plus } from 'lucide-react';
import { EntryCard } from './EntryCard';
import type { LogEntry, DailyLog, Entity } from '../types';

interface DayGroup {
    date: Date;
    dateString: string;
    entries: LogEntry[];
    isToday: boolean;
}

interface ActivityTimelineProps {
    logs: DailyLog[];
    onEntityFilter?: (entity: Entity) => void;
    onEditEntry?: (entry: LogEntry) => void;
    onDeleteEntry?: (id: number) => void;
    onNewEntry?: () => void;
    activeFilter?: string | null;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
    logs,
    onEntityFilter,
    onEditEntry,
    onDeleteEntry,
    onNewEntry,
    activeFilter
}) => {
    // Track which days are collapsed
    const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

    // Group entries by day
    const dayGroups: DayGroup[] = useMemo(() => {
        return logs.map(log => {
            const date = parseISO(log.date);
            return {
                date,
                dateString: log.date,
                entries: log.log_entries || [],
                isToday: isToday(date)
            };
        }).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [logs]);

    // Calculate total time for a day (placeholder - would need duration field)
    const calculateDayTime = useCallback((entries: LogEntry[]): string => {
        // For now, estimate based on entry count (30min per entry average)
        const totalMinutes = entries.length * 30;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hours > 0) {
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${mins}m`;
    }, []);

    const toggleDay = useCallback((dateString: string) => {
        setCollapsedDays(prev => {
            const next = new Set(prev);
            if (next.has(dateString)) {
                next.delete(dateString);
            } else {
                next.add(dateString);
            }
            return next;
        });
    }, []);

    const formatDayHeader = useCallback((date: Date, isToday: boolean): string => {
        if (isToday) return 'Today';
        const today = startOfDay(new Date());
        const targetDay = startOfDay(date);
        const diffDays = Math.floor((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) return 'Yesterday';
        return format(date, 'EEEE, MMM d');
    }, []);

    if (dayGroups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-background-elevated border border-border flex items-center justify-center mb-4">
                    <Clock size={28} className="text-text-muted" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">No activities yet</h3>
                <p className="text-sm text-text-muted max-w-xs mb-4">
                    Start tracking your day by creating your first entry.
                </p>
                <button
                    onClick={onNewEntry}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-indigo text-white text-sm font-medium hover:bg-accent-indigo-hover transition-colors"
                >
                    <Plus size={16} />
                    New Entry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Active filter indicator */}
            {activeFilter && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-indigo/10 border border-accent-indigo/20 animate-fade-in">
                    <span className="text-xs text-accent-indigo font-medium">
                        Filtered by: {activeFilter}
                    </span>
                    <button
                        onClick={() => onEntityFilter?.(null as any)}
                        className="ml-auto text-xs text-text-muted hover:text-text-primary"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Day groups */}
            {dayGroups.map((group, groupIndex) => {
                const isCollapsed = collapsedDays.has(group.dateString);
                const entryCount = group.entries.length;
                const totalTime = calculateDayTime(group.entries);

                // Default: today expanded, others collapsed
                const shouldCollapse = !group.isToday && !collapsedDays.has(`expanded-${group.dateString}`);
                const isActuallyCollapsed = group.isToday ? isCollapsed : shouldCollapse && !collapsedDays.has(group.dateString);

                return (
                    <div key={group.dateString} className="animate-fade-in">
                        {/* Day header */}
                        <button
                            onClick={() => toggleDay(group.dateString)}
                            className={`w-full day-header mb-2 ${group.isToday ? 'day-header-today' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                {isActuallyCollapsed ? (
                                    <ChevronRight size={14} className="text-text-muted" />
                                ) : (
                                    <ChevronDown size={14} className="text-text-muted" />
                                )}
                                <span className={`text-sm font-semibold ${group.isToday ? 'text-accent-indigo' : 'text-text-primary'}`}>
                                    {formatDayHeader(group.date, group.isToday)}
                                </span>
                                <span className="text-xs text-text-muted">
                                    {format(group.date, 'MMM d, yyyy')}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
                                    {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                                </span>
                                <span className="duration-badge">
                                    {totalTime}
                                </span>
                            </div>
                        </button>

                        {/* Entries list */}
                        {!isActuallyCollapsed && (
                            <div className="pl-2 animate-slide-up">
                                {group.entries.length > 0 ? (
                                    group.entries.map((entry, idx) => (
                                        <EntryCard
                                            key={entry.id}
                                            entry={entry}
                                            isLast={idx === group.entries.length - 1}
                                            onEdit={onEditEntry}
                                            onDelete={onDeleteEntry}
                                            onEntityClick={onEntityFilter}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-sm text-text-muted">
                                        No entries for this day
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ActivityTimeline;
