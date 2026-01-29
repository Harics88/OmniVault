import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[1000] bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-3 animate-slide-up">
            <WifiOff size={18} />
            <span className="text-sm font-bold tracking-wide">You are currently offline. Some features may be unavailable.</span>
        </div>
    );
};

export default OfflineBanner;
