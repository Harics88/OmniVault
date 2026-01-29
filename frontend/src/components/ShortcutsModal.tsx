import React, { useEffect } from 'react';
import { X, Keyboard as KeyboardIcon, Command } from 'lucide-react';

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const shortcuts = [
    {
        section: 'Navigation', items: [
            { action: 'Go Home', keys: ['G', 'H'] },
            { action: 'Go to Tasks', keys: ['G', 'T'] },
            { action: 'Go to Daily Log', keys: ['G', 'D'] },
            { action: 'Go to Notes', keys: ['G', 'N'] },
            { action: 'Go to Snippets', keys: ['G', 'S'] },
            { action: 'Go to Bookmarks', keys: ['G', 'B'] },
        ]
    },
    {
        section: 'Global', items: [
            { action: 'Command Palette', keys: ['Ctrl', 'K'] },
            { action: 'Toggle Sidebar', keys: ['Ctrl', 'B'] },
            { action: 'Show Shortcuts', keys: ['?'] },
        ]
    },
    {
        section: 'Tasks', items: [
            { action: 'Edit Task', keys: ['Enter'] },
            { action: 'Quick Complete', keys: ['C'] },
            { action: 'Delete Task', keys: ['Del'] },
        ]
    }
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-background-card border border-border w-full max-w-2xl rounded-2xl shadow-elevated overflow-hidden animate-slide-up">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-blue/10 rounded-lg">
                            <KeyboardIcon size={20} className="text-accent-blue" />
                        </div>
                        <h2 className="text-xl font-bold text-text-primary">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-background-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {shortcuts.map((section) => (
                        <div key={section.section}>
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">{section.section}</h3>
                            <div className="space-y-3">
                                {section.items.map((item) => (
                                    <div key={item.action} className="flex items-center justify-between">
                                        <span className="text-sm text-text-secondary">{item.action}</span>
                                        <div className="flex gap-1">
                                            {item.keys.map((key) => (
                                                <kbd key={key} className="kbd text-[10px] min-w-[20px]">{key}</kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-background-elevated/50 border-t border-border flex justify-between items-center">
                    <p className="text-xs text-text-muted">
                        Press <kbd className="kbd text-[10px]">Esc</kbd> to close
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Command size={14} />
                        <span>Command Palette: <kbd className="kbd text-[10px]">Ctrl+K</kbd></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShortcutsModal;
