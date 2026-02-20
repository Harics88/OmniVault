import React, { useState, createContext, useContext } from 'react';

interface ToastContextType {
    showToast: (message: string, action?: { label: string; onClick: () => void }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [message, setMessage] = useState<string | null>(null);
    const [action, setAction] = useState<{ label: string; onClick: () => void } | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const showToast = (msg: string, act?: { label: string; onClick: () => void }) => {
        setMessage(msg);
        setAction(act || null);
        setIsVisible(true);
        setTimeout(() => setIsVisible(false), 5000); // 5 seconds default
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 bg-text-primary text-background rounded-xl shadow-2xl font-bold flex items-center gap-4 transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-90 pointer-events-none'
                    }`}
            >
                <span>{message}</span>
                {action && (
                    <button
                        onClick={() => {
                            action.onClick();
                            setIsVisible(false);
                        }}
                        className="px-3 py-1 bg-background text-text-primary rounded-lg text-xs hover:bg-background-hover transition-colors border border-border/20"
                    >
                        {action.label}
                    </button>
                )}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
