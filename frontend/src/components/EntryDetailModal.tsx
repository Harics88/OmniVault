import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    X,
    Code2,
    Bug,
    Users,
    Eye,
    FileText,
    MessageSquare,
    Lightbulb,
    Briefcase,
    Clock,
    Calendar,
    Trash2,
    Edit2,
    Check,
    Loader2
} from 'lucide-react';
import type { LogEntry, LogEntryType, UpdateLogEntry, Entity } from '../types';
import { extractEntityIds } from '../utils/editor';
import { LiteEditor } from './LiteEditor';

interface EntryDetailModalProps {
    entry: LogEntry | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (id: number, data: UpdateLogEntry) => Promise<void>;
    onDelete: (id: number) => void;
    entities?: Entity[];
}

const typeConfig: Record<LogEntryType, { icon: React.ElementType; label: string; color: string }> = {
    work: { icon: Code2, label: 'Code', color: '#1F6FEB' },
    issue: { icon: Bug, label: 'Bug', color: '#F85149' },
    meeting: { icon: Users, label: 'Meeting', color: '#A371F7' },
    note: { icon: FileText, label: 'Note', color: '#7D8590' },
    idea: { icon: Lightbulb, label: 'Idea', color: '#D29922' },
    learning: { icon: Eye, label: 'Review', color: '#3FB950' },
    task_completion: { icon: Briefcase, label: 'Completed', color: '#3FB950' },
    communication: { icon: MessageSquare, label: 'Communication', color: '#7D8590' },
};

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
    entry,
    isOpen,
    onClose,
    onEdit,
    onDelete,
    entities = []
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Reset state when entry changes
    useEffect(() => {
        if (entry) {
            setEditContent(entry.content);
            setIsEditing(false);
        }
    }, [entry, entry?.content]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isEditing) {
                    setIsEditing(false);
                    setEditContent(entry?.content || '');
                } else {
                    onClose();
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, isEditing, entry, onClose]);

    const timestamp = entry ? new Date(entry.timestamp) : new Date();

    // Process content for hashtags while preserving HTML
    const processedContent = React.useMemo(() => {
        if (!entry?.content) return '';
        if (entry.content.startsWith('<')) {
            return entry.content.replace(/(#[a-zA-Z0-9_]+)/g, '<span class="text-[#1F6FEB] hover:underline cursor-pointer">$1</span>');
        }
        return entry.content.replace(/(#[a-zA-Z0-9_]+|@\w+)/g, (match) => {
            if (match.startsWith('#')) return `<span class="text-[#1F6FEB]">${match}</span>`;
            if (match.startsWith('@')) return `<span class="text-[#A371F7] font-medium">${match}</span>`;
            return match;
        });
    }, [entry?.content]);

    if (!isOpen || !entry) return null;

    const config = typeConfig[entry.type] || typeConfig.note;
    const Icon = config.icon;

    const handleSave = async (content: string) => {
        if (!content.trim() || isSaving) return;
        setIsSaving(true);
        try {
            const entity_ids = extractEntityIds(content);
            await onEdit(entry.id, {
                content: content.trim(),
                entity_ids
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (confirm('Delete this entry?')) {
            onDelete(entry.id);
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <style>{`
                .entry-content-modal .mention {
                    background-color: rgba(163, 113, 247, 0.2);
                    color: #A371F7;
                    border-radius: 0.4rem;
                    padding: 0.1rem 0.3rem;
                    font-weight: 500;
                }
                .entry-content-modal ul {
                    list-style-type: disc;
                    margin-left: 1.5rem;
                    margin-top: 1rem;
                    margin-bottom: 1rem;
                }
                .entry-content-modal ol {
                    list-style-type: decimal;
                    margin-left: 1.5rem;
                    margin-top: 1rem;
                    margin-bottom: 1rem;
                }
                .entry-content-modal p {
                    margin-bottom: 1rem;
                }
                .entry-content-modal ul[data-type="taskList"] {
                    list-style: none;
                    margin-left: 0;
                    padding: 0;
                }
                .entry-content-modal ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                }
                .entry-content-modal ul[data-type="taskList"] input[type="checkbox"] {
                    margin-top: 0.25rem;
                }
            `}</style>
            <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#30363D]">
                    <div className="flex items-center gap-3">
                        <span
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
                            style={{
                                backgroundColor: `${config.color}20`,
                                color: config.color
                            }}
                        >
                            <Icon size={16} />
                            {config.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 rounded-lg hover:bg-[#21262D] text-[#7D8590] hover:text-[#E6EDF3] transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-2 rounded-lg hover:bg-[#21262D] text-[#7D8590] hover:text-[#F85149] transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[#21262D] text-[#7D8590] hover:text-[#E6EDF3] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-70px)]">
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-[#7D8590]">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>{format(timestamp, 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>{format(timestamp, 'h:mm a')}</span>
                        </div>
                    </div>

                    {/* Entry Content */}
                    {isEditing ? (
                        <div className="space-y-4">
                            <div className="min-h-[200px] p-4 bg-[#0D1117] border border-[#30363D] rounded-lg">
                                <LiteEditor
                                    content={editContent}
                                    onChange={setEditContent}
                                    onEnter={() => handleSave(editContent)}
                                    entities={entities}
                                    placeholder="What did you achieve?"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#30363D]">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditContent(entry.content);
                                    }}
                                    className="px-4 py-2 text-sm text-[#7D8590] hover:text-[#E6EDF3] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleSave(editContent)}
                                    disabled={!editContent.trim() || isSaving}
                                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#238636] text-white text-sm font-medium hover:bg-[#2ea043] disabled:opacity-50 transition-colors"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="text-[#E6EDF3] text-lg leading-relaxed entry-content-modal prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                        />
                    )}

                    {/* Entities */}
                    {!isEditing && entry.entities && entry.entities.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-[#30363D]">
                            <div className="text-xs font-semibold text-[#7D8590] uppercase tracking-wider mb-2">
                                Linked Entities
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {entry.entities.map(entity => (
                                    <span
                                        key={entity.id}
                                        className="px-2.5 py-1 rounded-full text-sm font-medium bg-[#21262D] text-[#A371F7]"
                                    >
                                        @{entity.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntryDetailModal;
