import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase, Minimize2 } from 'lucide-react';

const MODES = {
    work: { label: 'Focus', minutes: 25, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
    shortBreak: { label: 'Short Break', minutes: 5, color: 'text-accent-green', bg: 'bg-accent-green/10' },
    longBreak: { label: 'Long Break', minutes: 15, color: 'text-accent-amber', bg: 'bg-accent-amber/10' }
};

type TimerMode = keyof typeof MODES;

export default function PomodoroTimer() {
    const [mode, setMode] = useState<TimerMode>('work');
    const [timeLeft, setTimeLeft] = useState(MODES.work.minutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true); // Default to minimized to not clutter UI
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);

            // Notify user
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification("Time's up!", {
                    body: mode === 'work' ? "Focus session complete. Take a break!" : "Break over. Back to work!"
                });
            }

            // Play sound
            try {
                const audio = new Audio('/assets/notification.mp3'); // We'll need to ensure this asset exists or use a base64 sound
                audio.play().catch(() => {}); // Catch play errors (e.g. user didn't interact)
            } catch (e) {
                // Ignore audio errors
            }
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, timeLeft, mode]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(MODES[mode].minutes * 60);
    };

    const changeMode = (newMode: TimerMode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(MODES[newMode].minutes * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = 1 - (timeLeft / (MODES[mode].minutes * 60));

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
                <button
                    onClick={() => setIsMinimized(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border border-border bg-background-card hover:bg-background-elevated transition-all ${isActive ? 'ring-1 ring-accent-blue' : ''}`}
                >
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-accent-green animate-pulse' : 'bg-text-muted'}`} />
                    <span className="font-mono font-medium text-sm">{formatTime(timeLeft)}</span>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
            <div className="bg-background-card border border-border rounded-xl shadow-2xl w-72 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-border bg-background-elevated/50">
                    <div className="flex items-center gap-2">
                        {mode === 'work' ? <Briefcase size={16} className="text-accent-blue" /> : <Coffee size={16} className="text-accent-amber" />}
                        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{MODES[mode].label}</span>
                    </div>
                    <button onClick={() => setIsMinimized(true)} className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-background-hover">
                        <Minimize2 size={16} />
                    </button>
                </div>

                {/* Timer Display */}
                <div className="p-6 flex flex-col items-center relative">
                    {/* Progress Background (Simple) */}
                    <div className="absolute bottom-0 left-0 h-1 bg-accent-blue/20 w-full">
                        <div
                            className={`h-full transition-all duration-1000 ${mode === 'work' ? 'bg-accent-blue' : 'bg-accent-green'}`}
                            style={{ width: `${progress * 100}%` }}
                        />
                    </div>

                    <div className="text-5xl font-mono font-bold text-text-primary mb-6 tracking-tight">
                        {formatTime(timeLeft)}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={toggleTimer}
                            className={`p-3 rounded-full transition-all shadow-md ${
                                isActive
                                    ? 'bg-background-elevated text-text-primary hover:bg-background-hover'
                                    : 'bg-accent-blue text-white hover:bg-accent-blue-hover hover:scale-105'
                            }`}
                        >
                            {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                        </button>
                        <button
                            onClick={resetTimer}
                            className="p-3 rounded-full bg-background-elevated text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>

                    {/* Mode Switcher */}
                    <div className="flex gap-1 bg-background-elevated p-1 rounded-lg w-full">
                        <button
                            onClick={() => changeMode('work')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'work' ? 'bg-background shadow-sm text-accent-blue' : 'text-text-muted hover:text-text-primary'}`}
                        >
                            Focus
                        </button>
                        <button
                            onClick={() => changeMode('shortBreak')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'shortBreak' ? 'bg-background shadow-sm text-accent-green' : 'text-text-muted hover:text-text-primary'}`}
                        >
                            Short
                        </button>
                        <button
                            onClick={() => changeMode('longBreak')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'longBreak' ? 'bg-background shadow-sm text-accent-amber' : 'text-text-muted hover:text-text-primary'}`}
                        >
                            Long
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
