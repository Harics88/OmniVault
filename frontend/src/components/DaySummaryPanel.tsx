import React from 'react';
import { format } from 'date-fns';
import {
    Clock,
    Briefcase,
    Users,
    AlertCircle,
    MessageSquare,
    Lightbulb,
    TrendingUp,
    Tag
} from 'lucide-react';
import type { LogEntry, LogEntryType, Entity } from '../types';

interface DaySummaryPanelProps {
    date: Date;
    entries: LogEntry[];
    onEntityClick?: (entity: Entity) => void;
}

const typeConfig: Record<LogEntryType, { icon: React.ElementType; label: string; color: string }> = {
    work: { icon: Briefcase, label: 'Work', color: '#6366F1' },
    meeting: { icon: Users, label: 'Meeting', color: '#8B5CF6' },
    issue: { icon: AlertCircle, label: 'Issue', color: '#F43F5E' },
    note: { icon: MessageSquare, label: 'Note', color: '#64748B' },
    idea: { icon: Lightbulb, label: 'Idea', color: '#F59E0B' },
    task_completion: { icon: Briefcase, label: 'Done', color: '#6366F1' },
    communication: { icon: MessageSquare, label: 'Comms', color: '#64748B' },
    learning: { icon: Lightbulb, label: 'Learn', color: '#F59E0B' },
};

export const DaySummaryPanel: React.FC<DaySummaryPanelProps> = ({
    date,
    entries,
    onEntityClick
}) => {
    // Calculate stats
    const totalEntries = entries.length;
    const estimatedMinutes = totalEntries * 30; // Placeholder until duration field
    const hours = Math.floor(estimatedMinutes / 60);
    const mins = estimatedMinutes % 60;
    const totalTimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    // Count by type
    const typeCounts = entries.reduce((acc, entry) => {
        acc[entry.type] = (acc[entry.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Get unique entities
    const entityMap = new Map<number, Entity>();
    entries.forEach(entry => {
        entry.entities?.forEach(entity => {
            entityMap.set(entity.id, entity);
        });
    });
    const uniqueEntities = Array.from(entityMap.values());

    // Find max count for bar chart scaling
    const maxCount = Math.max(...Object.values(typeCounts), 1);

    return (
        <aside className="w-72 flex-shrink-0 space-y-4">
            {/* Date header */}
            <div className="p-4 bg-background-card border border-border rounded-xl">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    {format(date, 'EEEE')}
                </div>
                <div className="text-xl font-bold text-text-primary">
                    {format(date, 'MMMM d, yyyy')}
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-background-card border border-border rounded-xl">
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                        <TrendingUp size={14} />
                        <span className="text-[10px] uppercase tracking-wider font-medium">Entries</span>
                    </div>
                    <div className="text-2xl font-bold text-text-primary">
                        {totalEntries}
                    </div>
                </div>
                <div className="p-4 bg-background-card border border-border rounded-xl">
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                        <Clock size={14} />
                        <span className="text-[10px] uppercase tracking-wider font-medium">Time</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-text-primary">
                        {totalTimeStr}
                    </div>
                </div>
            </div>

            {/* Type breakdown */}
            {totalEntries > 0 && (
                <div className="p-4 bg-background-card border border-border rounded-xl">
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                        By Type
                    </h3>
                    <div className="space-y-2">
                        {Object.entries(typeCounts)
                            .sort((a, b) => b[1] - a[1])
                            .map(([type, count]) => {
                                const config = typeConfig[type as LogEntryType];
                                if (!config) return null;
                                const Icon = config.icon;
                                const percentage = (count / maxCount) * 100;

                                return (
                                    <div key={type} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <Icon size={12} style={{ color: config.color }} />
                                                <span className="text-text-secondary">{config.label}</span>
                                            </div>
                                            <span className="font-mono text-text-muted">{count}</span>
                                        </div>
                                        <div className="h-1.5 bg-background-hover rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: config.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Entities worked with */}
            {uniqueEntities.length > 0 && (
                <div className="p-4 bg-background-card border border-border rounded-xl">
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 mb-3">
                        <Tag size={12} />
                        Entities
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {uniqueEntities.map(entity => (
                            <button
                                key={entity.id}
                                onClick={() => onEntityClick?.(entity)}
                                className="entity-tag"
                            >
                                {entity.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {totalEntries === 0 && (
                <div className="p-6 bg-background-card border border-border rounded-xl text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-background-elevated flex items-center justify-center">
                        <Clock size={20} className="text-text-muted" />
                    </div>
                    <p className="text-sm text-text-muted">
                        No entries logged for this day yet.
                    </p>
                </div>
            )}
        </aside>
    );
};

export default DaySummaryPanel;
