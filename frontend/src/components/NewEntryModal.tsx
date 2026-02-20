import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import {
    X,
    Briefcase,
    Users,
    AlertCircle,
    MessageSquare,
    Lightbulb,
    Clock,
    Tag,
    Search,
    Plus
} from 'lucide-react';
import type { LogEntryType, Entity, CreateLogEntry } from '../types';
import { entitiesApi } from '../lib/api';

interface NewEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: CreateLogEntry) => Promise<void>;
    date: string;
}

const entryTypes: { type: LogEntryType; icon: React.ElementType; label: string; colorClass: string }[] = [
    { type: 'work', icon: Briefcase, label: 'Work', colorClass: 'entry-badge-work' },
    { type: 'meeting', icon: Users, label: 'Meeting', colorClass: 'entry-badge-meeting' },
    { type: 'issue', icon: AlertCircle, label: 'Issue', colorClass: 'entry-badge-issue' },
    { type: 'note', icon: MessageSquare, label: 'Note', colorClass: 'entry-badge-note' },
    { type: 'idea', icon: Lightbulb, label: 'Idea', colorClass: 'entry-badge-idea' },
];

export const NewEntryModal: React.FC<NewEntryModalProps> = ({
    isOpen,
    onClose,
    onSave,
    date
}) => {
    const [selectedType, setSelectedType] = useState<LogEntryType>('work');
    const [content, setContent] = useState('');
    const [timestamp, setTimestamp] = useState(format(new Date(), 'HH:mm'));
    const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
    const [showEntitySearch, setShowEntitySearch] = useState(false);
    const [entitySearchQuery, setEntitySearchQuery] = useState('');
    const [availableEntities, setAvailableEntities] = useState<Entity[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const contentRef = useRef<HTMLTextAreaElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Focus content input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => contentRef.current?.focus(), 100);
            loadEntities();
        }
    }, [isOpen]);

    // Reset form on close
    useEffect(() => {
        if (!isOpen) {
            setContent('');
            setSelectedType('work');
            setSelectedEntities([]);
            setTimestamp(format(new Date(), 'HH:mm'));
            setShowEntitySearch(false);
        }
    }, [isOpen]);

    const loadEntities = async () => {
        try {
            const entities = await entitiesApi.getAll();
            setAvailableEntities(entities);
        } catch (error) {
            console.error('Failed to load entities:', error);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            // Escape to close
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            // Cmd/Ctrl + Enter to save
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSave();
                return;
            }

            // Number keys 1-5 to select type (when not typing)
            if (!e.target || (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 5) {
                    setSelectedType(entryTypes[num - 1].type);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, content]);

    const handleSave = async () => {
        if (!content.trim()) return;

        setIsLoading(true);
        try {
            const [hours, minutes] = timestamp.split(':').map(Number);
            const entryTimestamp = new Date();
            entryTimestamp.setHours(hours, minutes, 0, 0);

            await onSave({
                log_date: date,
                type: selectedType,
                content: content.trim(),
                timestamp: entryTimestamp.toISOString(),
                entity_ids: selectedEntities.map(e => e.id)
            });
            onClose();
        } catch (error) {
            console.error('Failed to save entry:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleEntity = (entity: Entity) => {
        if (selectedEntities.find(e => e.id === entity.id)) {
            setSelectedEntities(selectedEntities.filter(e => e.id !== entity.id));
        } else {
            setSelectedEntities([...selectedEntities, entity]);
        }
    };

    const filteredEntities = availableEntities.filter(e =>
        e.name.toLowerCase().includes(entitySearchQuery.toLowerCase()) ||
        (e.aliases && e.aliases.toLowerCase().includes(entitySearchQuery.toLowerCase()))
    );

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div ref={modalRef} className="modal-content" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="text-base font-semibold text-text-primary">New Entry</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-background-hover text-text-muted hover:text-text-primary transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Type selector */}
                    <div className="flex gap-2">
                        {entryTypes.map((type, idx) => {
                            const Icon = type.icon;
                            const isSelected = selectedType === type.type;
                            return (
                                <button
                                    key={type.type}
                                    onClick={() => setSelectedType(type.type)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isSelected
                                            ? `${type.colorClass} ring-1 ring-current`
                                            : 'bg-background-hover text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <Icon size={14} />
                                    <span>{type.label}</span>
                                    <span className="text-[10px] text-text-muted ml-1">{idx + 1}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Content textarea */}
                    <div>
                        <textarea
                            ref={contentRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What did you work on?"
                            rows={3}
                            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder-text-muted resize-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo transition-colors"
                        />
                    </div>

                    {/* Time input */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-text-muted" />
                            <span className="text-xs text-text-muted">Time:</span>
                            <input
                                type="time"
                                value={timestamp}
                                onChange={(e) => setTimestamp(e.target.value)}
                                className="px-2 py-1 bg-background border border-border rounded-md text-sm font-mono text-text-primary focus:border-accent-indigo focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Entity selection */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Tag size={14} className="text-text-muted" />
                            <span className="text-xs text-text-muted">Entities:</span>
                        </div>

                        {/* Selected entities */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {selectedEntities.map(entity => (
                                <button
                                    key={entity.id}
                                    onClick={() => toggleEntity(entity)}
                                    className="entity-tag pr-1"
                                >
                                    {entity.name}
                                    <X size={10} className="ml-1 opacity-60 hover:opacity-100" />
                                </button>
                            ))}
                            <button
                                onClick={() => setShowEntitySearch(!showEntitySearch)}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
                            >
                                <Plus size={10} />
                                Add
                            </button>
                        </div>

                        {/* Entity search dropdown */}
                        {showEntitySearch && (
                            <div className="p-2 bg-background border border-border rounded-lg animate-fade-in">
                                <div className="relative mb-2">
                                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        type="text"
                                        value={entitySearchQuery}
                                        onChange={(e) => setEntitySearchQuery(e.target.value)}
                                        placeholder="Search entities..."
                                        className="w-full pl-7 pr-3 py-1.5 bg-background-elevated border border-border-subtle rounded text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-indigo"
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-0.5">
                                    {filteredEntities.slice(0, 8).map(entity => {
                                        const isSelected = selectedEntities.find(e => e.id === entity.id);
                                        return (
                                            <button
                                                key={entity.id}
                                                onClick={() => toggleEntity(entity)}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${isSelected
                                                        ? 'bg-accent-indigo/10 text-accent-indigo'
                                                        : 'hover:bg-background-hover text-text-secondary hover:text-text-primary'
                                                    }`}
                                            >
                                                <span className="font-medium">{entity.name}</span>
                                                <span className="text-[10px] text-text-muted uppercase">{entity.type}</span>
                                            </button>
                                        );
                                    })}
                                    {filteredEntities.length === 0 && (
                                        <div className="text-center py-2 text-xs text-text-muted">
                                            No entities found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-background-elevated/50 rounded-b-xl">
                    <span className="text-[10px] text-text-muted">
                        <span className="kbd">⌘</span> <span className="kbd">↵</span> to save
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-background-hover transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!content.trim() || isLoading}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-accent-indigo text-white hover:bg-accent-indigo-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Saving...' : 'Save Entry'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewEntryModal;
