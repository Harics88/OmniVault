import React, { useState } from 'react';
import {
    Code2,
    Bug,
    Users,
    Eye,
    FileText,
    Lightbulb,
    Loader2,
    Send
} from 'lucide-react';
import type { LogEntryType, CreateLogEntry, Entity } from '../types';
import { extractEntityIds } from '../utils/editor';
import { LiteEditor } from './LiteEditor';

interface EntryComposerProps {
    date: string;
    onSubmit: (entry: CreateLogEntry) => Promise<void>;
    isLoading?: boolean;
    onSuccess?: () => void;
    entities?: Entity[];
}

const entryTypes: { type: LogEntryType; icon: React.ElementType; label: string; color: string }[] = [
    { type: 'work', icon: Code2, label: 'Code', color: '#1F6FEB' },
    { type: 'issue', icon: Bug, label: 'Bug', color: '#F85149' },
    { type: 'meeting', icon: Users, label: 'Meeting', color: '#A371F7' },
    { type: 'learning', icon: Eye, label: 'Review', color: '#3FB950' },
    { type: 'note', icon: FileText, label: 'Note', color: '#7D8590' },
    { type: 'idea', icon: Lightbulb, label: 'Idea', color: '#D29922' },
];

export const EntryComposer: React.FC<EntryComposerProps> = React.memo(({
    date,
    onSubmit,
    isLoading = false,
    onSuccess,
    entities = []
}) => {
    const [content, setContent] = useState('');
    const [selectedType, setSelectedType] = useState<LogEntryType>('note');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        // Clean up content: if it's just empty paragraphs, don't submit
        const isActuallyEmpty = !content || content === '<p></p>' || content.trim() === '';
        if (isActuallyEmpty || isLoading || isSubmitting) return;

        setIsSubmitting(true);

        try {
            const entity_ids = extractEntityIds(content);
            await onSubmit({
                log_date: date,
                type: selectedType,
                content: content.trim(),
                timestamp: new Date().toISOString(),
                entity_ids
            });

            // Reset form only on success
            setContent('');
            setSelectedType('note');

            // Call success callback
            onSuccess?.();
        } catch {
            // Error is handled by the parent mutation's onError
        } finally {
            setIsSubmitting(false);
        }
    };

    const actuallyLoading = isLoading || isSubmitting;

    return (
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-lg hover:border-[#3D444D] transition-colors duration-300">
            {/* Main input area */}
            <div className="p-4 pb-3">
                <div className="flex gap-3">
                    {/* Avatar placeholder */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex-shrink-0 shadow-sm" />

                    {/* Rich Text Editor */}
                    <div className="flex-1 relative">
                        <LiteEditor
                            content={content}
                            onChange={setContent}
                            onEnter={handleSubmit}
                            entities={entities}
                            placeholder="What did you achieve today? Use @entity to link..."
                        />
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#30363D]" />

            {/* Entry type selector + action bar combined */}
            <div className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex flex-wrap gap-1.5">
                    {entryTypes.map((type) => {
                        const TypeIcon = type.icon;
                        const isSelected = selectedType === type.type;
                        return (
                            <button
                                key={type.type}
                                onClick={() => setSelectedType(type.type)}
                                disabled={actuallyLoading}
                                className={`
                                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium
                                    transition-all duration-200 disabled:opacity-50
                                    ${isSelected
                                        ? 'text-white shadow-sm scale-105'
                                        : 'bg-[#21262D] text-[#E6EDF3] hover:bg-[#30363D]'
                                    }
                                `}
                                style={isSelected ? { backgroundColor: type.color } : undefined}
                            >
                                <TypeIcon size={12} style={{ color: isSelected ? 'white' : type.color }} />
                                <span>{type.label}</span>
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={actuallyLoading || !content || content === '<p></p>'}
                    className="
                        flex items-center gap-2 px-5 py-2 rounded-full
                        bg-[#1F6FEB] text-white text-sm font-semibold
                        hover:bg-[#388BFD] disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200 hover:shadow-lg hover:shadow-[#1F6FEB]/20
                        active:scale-95
                    "
                >
                    {actuallyLoading ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Posting...
                        </>
                    ) : (
                        <>
                            <Send size={14} />
                            Post
                        </>
                    )}
                </button>
            </div>

            {/* Keyboard hint */}
            <div className="px-4 pb-2">
                <span className="text-[10px] text-[#484F58]">
                    <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[#7D8590]">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[#7D8590]">↵</kbd> to post • Type <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[#A371F7]">@</kbd> to link entity
                </span>
            </div>
        </div>
    );
});

export default EntryComposer;
