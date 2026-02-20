import React, { useState } from 'react';
import { formatDisplayDate, formatDisplayTime } from '../utils/date';
import {
    Briefcase,
    Users,
    AlertCircle,
    MessageSquare,
    Lightbulb,
    Edit2,
    Trash2,
    ChevronDown,
    ChevronRight,
    Clock
} from 'lucide-react';
import type { LogEntry, LogEntryType, Entity } from '../types';

interface EntryCardProps {
    entry: LogEntry;
    isLast?: boolean;
    onEdit?: (entry: LogEntry) => void;
    onDelete?: (id: number) => void;
    onEntityClick?: (entity: Entity) => void;
}

const typeConfig: Record<LogEntryType, { icon: React.ElementType; label: string; colorClass: string }> = {
    work: { icon: Briefcase, label: 'Work', colorClass: 'entry-badge-work' },
    meeting: { icon: Users, label: 'Meeting', colorClass: 'entry-badge-meeting' },
    issue: { icon: AlertCircle, label: 'Issue', colorClass: 'entry-badge-issue' },
    note: { icon: MessageSquare, label: 'Note', colorClass: 'entry-badge-note' },
    idea: { icon: Lightbulb, label: 'Idea', colorClass: 'entry-badge-idea' },
    task_completion: { icon: Briefcase, label: 'Done', colorClass: 'entry-badge-work' },
    communication: { icon: MessageSquare, label: 'Comms', colorClass: 'entry-badge-note' },
    learning: { icon: Lightbulb, label: 'Learn', colorClass: 'entry-badge-idea' },
};

export const EntryCard: React.FC<EntryCardProps> = ({
    entry,
    isLast = false,
    onEdit,
    onDelete,
    onEntityClick
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const config = typeConfig[entry.type] || typeConfig.note;
    const IconComponent = config.icon;
    const timestamp = formatDisplayTime(entry.timestamp);

    return (
        <div
            className={`group entry-card ${isExpanded ? 'entry-card-expanded' : ''}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Timeline connector */}
            {!isLast && <div className="timeline-connector" />}

            {/* Type indicator dot */}
            <div className="relative z-10 mt-1 flex-shrink-0">
                <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `rgb(var(--entry-${entry.type}) / 0.15)` }}
                >
                    <IconComponent size={12} className={`text-entry-${entry.type}`} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-medium text-text-muted">
                        {timestamp}
                    </span>
                    <span className={`entry-badge ${config.colorClass}`}>
                        {config.label}
                    </span>
                </div>

                {/* Main content */}
                <p
                    className={`text-sm text-text-primary leading-relaxed cursor-pointer ${!isExpanded ? 'line-clamp-2' : ''
                        }`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {entry.content}
                </p>

                {/* Entity tags */}
                {entry.entities && entry.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {entry.entities.map(entity => (
                            <button
                                key={entity.id}
                                onClick={() => onEntityClick?.(entity)}
                                className="entity-tag"
                            >
                                {entity.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border animate-fade-in">
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                Created {formatDisplayDate(entry.created_at, 'MMM d, h:mm a')}
                            </span>
                            {entry.updated_at !== entry.created_at && (
                                <span>
                                    Updated {formatDisplayDate(entry.updated_at, 'MMM d, h:mm a')}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Expand indicator */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="self-start mt-1 p-1 rounded hover:bg-background-hover text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
            >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {/* Hover actions */}
            {showActions && (
                <div className="entry-actions">
                    <button
                        onClick={() => onEdit?.(entry)}
                        className="p-1 rounded hover:bg-background-hover text-text-muted hover:text-text-primary transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={13} />
                    </button>
                    <button
                        onClick={() => onDelete?.(entry.id)}
                        className="p-1 rounded hover:bg-accent-red/10 text-text-muted hover:text-accent-red transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default EntryCard;
