import React, { useState, createContext, useContext } from 'react';

interface ToastContextType {
    showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [message, setMessage] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const showToast = (msg: string) => {
        setMessage(msg);
        setIsVisible(true);
        setTimeout(() => setIsVisible(false), 3000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 bg-text-primary text-background rounded-xl shadow-2xl font-bold flex items-center gap-3 transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-90 pointer-events-none'
                    }`}
            >
                <span>{message}</span>
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
