import React, { useState, useEffect, useMemo } from 'react';
import { formatDisplayDate, formatDisplayTime } from '../utils/date';
import {
    Code2,
    Bug,
    Users,
    Eye,
    FileText,
    MessageSquare,
    Lightbulb,
    Briefcase,
    Trash2,
    Edit2,
    X,
    Check,
    Loader2
} from 'lucide-react';
import type { LogEntry, LogEntryType, UpdateLogEntry, Entity } from '../types';
import { extractEntityIds } from '../utils/editor';
import { LiteEditor } from './LiteEditor';

interface EntryRowProps {
    entry: LogEntry;
    onEdit?: (id: number, data: UpdateLogEntry) => Promise<void>;
    onDelete?: (id: number) => void;
    animationDelay?: number;
    entities?: Entity[];
    showDate?: boolean;           // Show the full date (for timeline/search views)
    editingId?: number | null;    // Currently editing entry id (for one-at-a-time enforcement)
    onEditingChange?: (id: number | null) => void; // Notify parent of edit state change
}

const typeConfig: Record<LogEntryType, { icon: React.ElementType; label: string; color: string }> = {
    work: { icon: Code2, label: 'CODE', color: '#1F6FEB' },
    issue: { icon: Bug, label: 'BUG', color: '#F85149' },
    meeting: { icon: Users, label: 'MEET', color: '#A371F7' },
    note: { icon: FileText, label: 'NOTE', color: '#7D8590' },
    idea: { icon: Lightbulb, label: 'IDEA', color: '#D29922' },
    learning: { icon: Eye, label: 'REVIEW', color: '#3FB950' },
    task_completion: { icon: Briefcase, label: 'DONE', color: '#3FB950' },
    communication: { icon: MessageSquare, label: 'COMM', color: '#7D8590' },
};

export const EntryRow: React.FC<EntryRowProps> = React.memo(({
    entry,
    onEdit,
    onDelete,
    animationDelay = 0,
    entities = [],
    showDate = false,
    editingId,
    onEditingChange,
}) => {
    // If editingId is managed externally, use that; otherwise manage locally
    const isControlled = editingId !== undefined;
    const isEditing = isControlled ? editingId === entry.id : false;
    const [localEditing, setLocalEditing] = useState(false);
    const effectiveEditing = isControlled ? isEditing : localEditing;

    const [editContent, setEditContent] = useState(entry.content);
    const [isSaving, setIsSaving] = useState(false);

    const config = typeConfig[entry.type] || typeConfig.note;
    const Icon = config.icon;

    const time = useMemo(() => formatDisplayTime(entry.timestamp), [entry.timestamp]);

    // Use log_date for the calendar date (timestamp is just the time-of-day)
    const dateLabel = useMemo(() => {
        if (!showDate || !entry.log_date) return null;
        return formatDisplayDate(entry.log_date, 'MMM d');
    }, [showDate, entry.log_date]);

    // Sync edit content when entry changes
    useEffect(() => {
        if (!effectiveEditing) {
            setEditContent(entry.content);
        }
    }, [entry.content, effectiveEditing]);

    // Process content for hashtags while preserving HTML
    const processedContent = useMemo(() => {
        if (entry.content.startsWith('<')) {
            return entry.content.replace(/(#[a-zA-Z0-9_]+)/g, '<span class="text-[#1F6FEB] hover:underline cursor-pointer">$1</span>');
        }
        return entry.content.split(/(#\w+)/g).map(part =>
            part.startsWith('#')
                ? `<span class="text-[#1F6FEB] hover:underline cursor-pointer">${part}</span>`
                : part
        ).join('');
    }, [entry.content]);

    const startEditing = () => {
        setEditContent(entry.content);
        if (isControlled) {
            onEditingChange?.(entry.id);
        } else {
            setLocalEditing(true);
        }
    };

    const cancelEditing = () => {
        setEditContent(entry.content);
        if (isControlled) {
            onEditingChange?.(null);
        } else {
            setLocalEditing(false);
        }
    };

    const handleSaveEdit = async (content: string) => {
        if (!content.trim() || isSaving) return;

        setIsSaving(true);
        try {
            const entity_ids = extractEntityIds(content);
            await onEdit?.(entry.id, {
                content: content.trim(),
                entity_ids
            });
            if (isControlled) {
                onEditingChange?.(null);
            } else {
                setLocalEditing(false);
            }
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="group flex items-center gap-2 py-1.5 px-3 hover:bg-[#1A2233] transition-all duration-200 animate-slide-up"
            onClick={(e) => {
                if (effectiveEditing) e.stopPropagation();
            }}
            style={{
                animationDelay: `${animationDelay}ms`,
                borderLeft: '2px solid transparent',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderLeftColor = config.color;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent';
            }}
        >
            <style>{`
                .entry-content .mention {
                    background-color: rgba(163, 113, 247, 0.2);
                    color: #A371F7;
                    border-radius: 0.4rem;
                    padding: 0.1rem 0.3rem;
                    font-weight: 500;
                }
                .entry-content ul {
                    list-style-type: disc;
                    margin-left: 1.5rem;
                }
                .entry-content ol {
                    list-style-type: decimal;
                    margin-left: 1.5rem;
                }
                .entry-content ul[data-type="taskList"] {
                    list-style: none;
                    margin-left: 0;
                    padding: 0;
                }
                .entry-content ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                }
                .entry-content ul[data-type="taskList"] input[type="checkbox"] {
                    margin-top: 0.25rem;
                }
            `}</style>

            {/* Date + Time inline */}
            <div className="flex items-center gap-1.5 flex-shrink-0 w-auto">
                {dateLabel && (
                    <>
                        <span className="text-[10px] font-bold text-[#E6EDF3]">{dateLabel}</span>
                        <span className="text-[10px] text-[#484F58]">•</span>
                    </>
                )}
                <span className="text-[11px] font-mono text-[#7D8590]">{time}</span>
            </div>

            {/* Type badge */}
            <span
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
                style={{
                    backgroundColor: `${config.color}20`,
                    color: config.color
                }}
            >
                <Icon size={9} />
                {config.label}
            </span>

            {/* Content */}
            {effectiveEditing ? (
                <div className="flex-1 flex flex-col gap-1.5 bg-[#0D1117] border border-[#30363D] rounded-lg p-2" onClick={(e) => e.stopPropagation()}>
                    <LiteEditor
                        content={editContent}
                        onChange={setEditContent}
                        onEnter={() => handleSaveEdit(editContent)}
                        entities={entities}
                        placeholder="Edit entry..."
                    />
                    <div className="flex justify-end gap-1.5 border-t border-[#30363D] pt-1.5">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleSaveEdit(editContent); }}
                            disabled={isSaving}
                            className="p-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white flex items-center gap-1 text-xs px-2.5"
                        >
                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            Save
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                            className="p-1 rounded hover:bg-[#30363D] text-[#7D8590] flex items-center gap-1 text-xs px-2.5"
                        >
                            <X size={12} />
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className="flex-1 text-[11px] text-[#E6EDF3] leading-snug entry-content prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                />
            )}

            {/* Entity tags */}
            {!effectiveEditing && entry.entities && entry.entities.length > 0 && (
                <div className="flex gap-1 flex-shrink-0">
                    {entry.entities.slice(0, 2).map(entity => (
                        <span
                            key={entity.id}
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#21262D] text-[#7D8590]"
                        >
                            {entity.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions (visible on hover) */}
            {!effectiveEditing && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); startEditing(); }}
                        className="p-1 rounded hover:bg-[#30363D] text-[#7D8590] hover:text-[#E6EDF3]"
                        title="Edit"
                    >
                        <Edit2 size={12} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(entry.id); }}
                        className="p-1 rounded hover:bg-[#30363D] text-[#7D8590] hover:text-[#F85149]"
                        title="Delete"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.entry.id === nextProps.entry.id &&
        prevProps.entry.content === nextProps.entry.content &&
        prevProps.entry.type === nextProps.entry.type &&
        prevProps.entry.timestamp === nextProps.entry.timestamp &&
        prevProps.animationDelay === nextProps.animationDelay &&
        prevProps.showDate === nextProps.showDate &&
        prevProps.editingId === nextProps.editingId
    );
});

EntryRow.displayName = 'EntryRow';

export default EntryRow;
