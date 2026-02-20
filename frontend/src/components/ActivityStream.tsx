import React, { useState, useEffect } from 'react';
import {
    Clock,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Lightbulb,
    BookOpen,
    Users,
    Briefcase,
    Plus,
    Tag,
    X,
    Server,
    Database,
    Search,
    Send
} from 'lucide-react';
import { formatDisplayTime } from '../utils/date';
import { LogEntry, LogEntryType, Entity } from '../types';
import { logEntriesApi, entitiesApi } from '../lib/api';

interface LogEntryItemProps {
    entry: LogEntry;
    onUpdate?: () => void;
    onDelete?: () => void;
}

export const LogEntryItem: React.FC<LogEntryItemProps> = ({ entry }) => {
    const getIcon = (type: LogEntryType) => {
        switch (type) {
            case 'work': return <Briefcase size={16} className="text-blue-500" />;
            case 'meeting': return <Users size={16} className="text-purple-500" />;
            case 'note': return <MessageSquare size={16} className="text-slate-400" />;
            case 'issue': return <AlertCircle size={16} className="text-red-500" />;
            case 'task_completion': return <CheckCircle2 size={16} className="text-emerald-500" />;
            case 'communication': return <MessageSquare size={16} className="text-sky-500" />;
            case 'learning': return <BookOpen size={16} className="text-amber-500" />;
            case 'idea': return <Lightbulb size={16} className="text-yellow-400" />;
            default: return <Clock size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="group relative flex gap-4 pl-4 pb-8 transition-all hover:bg-background-elevated/30 rounded-r-2xl">
            {/* Timeline Line */}
            <div className="absolute left-[23px] top-8 bottom-0 w-0.5 bg-border group-last:bg-transparent" />

            {/* Entry Icon/Dot */}
            <div className="relative z-10 mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-4 border-background bg-background-card ring-1 ring-border group-hover:scale-110 transition-transform">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
            </div>

            <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">
                            {formatDisplayTime(entry.timestamp)}
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background-elevated border border-border">
                            {getIcon(entry.type)}
                            <span className="text-[9px] font-bold text-text-secondary uppercase">{entry.type.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    </div>
                </div>

                <p className="text-sm text-text-primary leading-relaxed">{entry.content}</p>

                {entry.entities && entry.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {entry.entities.map(entity => (
                            <span key={entity.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent-blue/5 border border-accent-blue/10 text-[10px] text-accent-blue font-medium">
                                <Tag size={10} />
                                {entity.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

interface QuickDraftProps {
    date: string;
    onSuccess: () => void;
}

export const QuickDraft: React.FC<QuickDraftProps> = ({ date, onSuccess }) => {
    const [content, setContent] = useState('');
    const [type, setType] = useState<LogEntryType>('work');
    const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
    const [showEntitySearch, setShowEntitySearch] = useState(false);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (showEntitySearch) {
            loadEntities();
        }
    }, [showEntitySearch]);

    const loadEntities = async () => {
        try {
            const data = await entitiesApi.getAll();
            setEntities(data);
        } catch (error) {
            console.error('Failed to load entities:', error);
        }
    };

    const handleSend = async () => {
        if (!content.trim()) return;
        try {
            await logEntriesApi.create({
                log_date: date,
                type,
                content: content.trim(),
                entity_ids: selectedEntities.map(e => e.id)
            });
            setContent('');
            setSelectedEntities([]);
            onSuccess();
        } catch (error) {
            console.error('Failed to create log entry:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSend();
        }
    };

    const toggleEntity = (entity: Entity) => {
        if (selectedEntities.find(e => e.id === entity.id)) {
            setSelectedEntities(selectedEntities.filter(e => e.id !== entity.id));
        } else {
            setSelectedEntities([...selectedEntities, entity]);
        }
    };

    const filteredEntities = entities.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.aliases && e.aliases.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-50">
            <div className="bg-background-card border border-border rounded-2xl shadow-elevated-heavy p-2 animate-slide-up">
                {selectedEntities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-2 py-1 mb-2 border-b border-border">
                        {selectedEntities.map(e => (
                            <span key={e.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue text-[10px] font-bold">
                                {e.name}
                                <button onClick={() => toggleEntity(e)} className="hover:text-accent-red"><X size={10} /></button>
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex items-end gap-2 px-1">
                    <div className="relative">
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as LogEntryType)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        >
                            <option value="work">Work</option>
                            <option value="meeting">Meeting</option>
                            <option value="note">Note</option>
                            <option value="issue">Issue</option>
                            <option value="communication">Comms</option>
                            <option value="learning">Learning</option>
                            <option value="idea">Idea</option>
                        </select>
                        <div className="p-2.5 rounded-xl bg-background-elevated hover:bg-background-hover transition-colors text-text-muted">
                            <Plus size={20} />
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Check-in... (⌘ + Enter to send)"
                            rows={1}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm py-2.5 max-h-32 resize-none"
                            style={{ height: 'auto' }}
                        />
                        <div className="absolute right-2 bottom-2 flex items-center gap-1">
                            <button
                                onClick={() => setShowEntitySearch(!showEntitySearch)}
                                className={`p-1.5 rounded-lg transition-colors ${showEntitySearch ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-muted hover:text-text-primary'}`}
                                title="Link Entity"
                            >
                                <Tag size={16} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!content.trim()}
                        className={`p-2.5 rounded-xl transition-all ${content.trim() ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20' : 'bg-background-elevated text-text-muted cursor-not-allowed'}`}
                    >
                        <Send size={20} />
                    </button>
                </div>

                {showEntitySearch && (
                    <div className="mt-2 p-2 border-t border-border bg-background/50 rounded-b-xl max-h-48 overflow-y-auto">
                        <div className="relative mb-2">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter entities..."
                                className="w-full bg-background-elevated border border-border rounded-lg pl-7 pr-3 py-1 text-xs outline-none focus:ring-1 focus:ring-accent-blue"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-1 px-1">
                            {filteredEntities.map(entity => {
                                const isSelected = selectedEntities.find(e => e.id === entity.id);
                                return (
                                    <button
                                        key={entity.id}
                                        onClick={() => toggleEntity(entity)}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${isSelected ? 'bg-accent-blue/10 ring-1 ring-accent-blue/30' : 'hover:bg-background-hover'
                                            }`}
                                    >
                                        <div className={`p-1 rounded bg-background-card ${isSelected ? 'text-accent-blue' : 'text-text-muted'}`}>
                                            {entity.type === 'server' ? <Server size={12} /> :
                                                entity.type === 'database' ? <Database size={12} /> :
                                                    <Tag size={12} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-[10px] font-bold truncate ${isSelected ? 'text-accent-blue' : 'text-text-primary'}`}>{entity.name}</div>
                                            <div className="text-[8px] text-text-muted uppercase tracking-wider">{entity.type}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
