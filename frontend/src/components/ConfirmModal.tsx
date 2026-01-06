import { useRef, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    type = 'danger'
}: ConfirmModalProps) {
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            confirmButtonRef.current?.focus();

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-sm bg-background-card rounded-xl shadow-elevated border border-border overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-accent-red/10 rounded-full flex items-center justify-center">
                        <AlertTriangle size={24} className="text-accent-red" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">
                        {title}
                    </h3>
                    <p className="text-text-muted text-sm mb-6">
                        {message}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-border text-text-primary rounded-lg hover:bg-background-hover transition-colors font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            ref={confirmButtonRef}
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 px-4 py-2 bg-accent-red text-white rounded-lg hover:bg-accent-red/90 transition-colors font-medium shadow-sm"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>

                <div className="absolute top-2 right-2">
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-background-hover rounded-full transition-colors text-text-muted"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
