import React, { useState, useEffect, useRef } from 'react';
import { Link as LinkIcon, ExternalLink, X } from 'lucide-react';

interface LinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (url: string, text: string) => void;
    onRemove?: () => void;
    initialText?: string;
    initialUrl?: string;
}

export default function LinkModal({ isOpen, onClose, onSubmit, onRemove, initialText = '', initialUrl = '' }: LinkModalProps) {
    const [url, setUrl] = useState(initialUrl);
    const [text, setText] = useState(initialText);
    const urlInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setUrl(initialUrl);
            setText(initialText);
            // Focus the URL input when modal opens
            setTimeout(() => urlInputRef.current?.focus(), 50);
        }
    }, [isOpen, initialText, initialUrl]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onSubmit(url.trim(), text.trim());
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
            onClick={onClose}
        >
            <div
                className="bg-background-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <LinkIcon size={18} className="text-accent-blue" />
                        <h3 className="font-semibold text-text-primary">{initialUrl ? 'Edit Link' : 'Add Link'}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-background-hover rounded transition-colors"
                        type="button"
                    >
                        <X size={16} className="text-text-secondary" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                            Display Text
                        </label>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Text to display (optional)"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
                            <ExternalLink size={12} />
                            URL
                        </label>
                        <input
                            ref={urlInputRef}
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-all"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        {initialUrl && onRemove && (
                            <button
                                type="button"
                                onClick={() => {
                                    onRemove();
                                    onClose();
                                }}
                                className="px-4 py-2 text-sm text-accent-red hover:bg-accent-red/10 rounded-lg transition-all mr-auto font-medium"
                            >
                                Remove Link
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-hover rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!url.trim()}
                            className="px-4 py-2 text-sm bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-medium"
                        >
                            {initialUrl ? 'Update Link' : 'Add Link'}
                        </button>
                    </div>
                </form>

                {/* Helper text */}
                <div className="px-4 pb-3 text-[10px] text-text-muted italic border-t border-border/50 pt-2 mx-4 mb-2">
                    <p>💡 Tip: If display text is empty, the URL will be shown</p>
                </div>
            </div>
        </div>
    );
}
