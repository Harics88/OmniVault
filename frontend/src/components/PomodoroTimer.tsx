import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase, Minimize2, TrendingUp, CheckCircle } from 'lucide-react';

const MODES = {
    work: { label: 'Focus', minutes: 25, color: 'text-accent-blue', bg: 'bg-accent-blue/10', icon: Briefcase },
    shortBreak: { label: 'Short Break', minutes: 5, color: 'text-accent-green', bg: 'bg-accent-green/10', icon: Coffee },
    longBreak: { label: 'Long Break', minutes: 15, color: 'text-accent-amber', bg: 'bg-accent-amber/10', icon: Coffee }
};

type TimerMode = keyof typeof MODES;

interface Session {
    mode: TimerMode;
    duration: number;
    completedAt: Date;
}

export default function PomodoroTimer() {
    const [mode, setMode] = useState<TimerMode>('work');
    const [timeLeft, setTimeLeft] = useState(MODES.work.minutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [showStats, setShowStats] = useState(false);
    const [sessions, setSessions] = useState<Session[]>(() => {
        const saved = localStorage.getItem('pomodoroSessions');
        return saved ? JSON.parse(saved) : [];
    });
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('pomodoroSessions', JSON.stringify(sessions));
    }, [sessions]);

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
            // Session completed!
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);

            // Record completed session
            const completedSession: Session = {
                mode,
                duration: MODES[mode].minutes,
                completedAt: new Date()
            };
            setSessions((prev) => [...prev, completedSession]);

            // Notify user
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification("🎯 Time's up!", {
                    body: mode === 'work'
                        ? "Focus session complete! Great work! Take a break."
                        : "Break over. Ready for another focus session?",
                    icon: '/favicon.ico'
                });
            }

            // Play browser alert beep
            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.3;

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            } catch (e) {
                // Fallback - browser beep
                console.log('\u0007'); // System beep
            }

            // Auto-switch mode
            if (mode === 'work') {
                const workSessionsToday = getTodaySessions().filter(s => s.mode === 'work').length;
                // Every 4 work sessions, suggest long break
                if (workSessionsToday % 4 === 0) {
                    changeMode('longBreak');
                } else {
                    changeMode('shortBreak');
                }
            } else {
                changeMode('work');
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

    const getTodaySessions = () => {
        const today = new Date().toDateString();
        return sessions.filter(s => new Date(s.completedAt).toDateString() === today);
    };

    const getWeekSessions = () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sessions.filter(s => new Date(s.completedAt) >= weekAgo);
    };

    const clearHistory = () => {
        if (confirm('Clear all session history?')) {
            setSessions([]);
        }
    };

    const progress = 1 - (timeLeft / (MODES[mode].minutes * 60));
    const todaySessions = getTodaySessions();
    const todayFocusTime = todaySessions.filter(s => s.mode === 'work').reduce((acc, s) => acc + s.duration, 0);
    const weekSessions = getWeekSessions();

    // Minimized view
    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
                <button
                    onClick={() => setIsMinimized(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border border-border bg-background-card hover:bg-background-elevated transition-all ${isActive ? 'ring-2 ring-accent-blue ring-opacity-50' : ''}`}
                    title="Click to expand Pomodoro Timer"
                >
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-accent-green animate-pulse' : 'bg-text-muted'}`} />
                    <span className="font-mono font-medium text-sm text-text-primary">{formatTime(timeLeft)}</span>
                    {todaySessions.length > 0 && (
                        <span className="text-xs text-text-muted">
                            🍅 {todaySessions.filter(s => s.mode === 'work').length}
                        </span>
                    )}
                </button>
            </div>
        );
    }

    // Full view
    return (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
            <div className="bg-background-card border border-border rounded-xl shadow-2xl w-80 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-border bg-background-elevated/50">
                    <div className="flex items-center gap-2">
                        {mode === 'work' ? <Briefcase size={16} className="text-accent-blue" /> : <Coffee size={16} className="text-accent-amber" />}
                        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{MODES[mode].label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className={`text-text-muted hover:text-accent-blue p-1.5 rounded hover:bg-background-hover transition-colors ${showStats ? 'bg-background-hover text-accent-blue' : ''}`}
                            title="Toggle stats"
                        >
                            <TrendingUp size={14} />
                        </button>
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="text-text-muted hover:text-text-primary p-1.5 rounded hover:bg-background-hover transition-colors"
                            title="Minimize"
                        >
                            <Minimize2 size={14} />
                        </button>
                    </div>
                </div>

                {showStats ? (
                    /* Stats View */
                    <div className="p-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-text-muted">Today's Focus</span>
                                <span className="text-lg font-bold text-text-primary">{todayFocusTime}m</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-text-muted">Sessions Today</span>
                                <span className="text-lg font-bold text-accent-blue">
                                    {todaySessions.filter(s => s.mode === 'work').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-text-muted">This Week</span>
                                <span className="text-lg font-bold text-accent-green">
                                    {weekSessions.filter(s => s.mode === 'work').length}
                                </span>
                            </div>

                            {todaySessions.length > 0 && (
                                <div className="pt-3 border-t border-border">
                                    <div className="text-xs text-text-muted mb-2">Today's Sessions</div>
                                    <div className="flex flex-wrap gap-1">
                                        {todaySessions.map((session, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-6 h-6 rounded flex items-center justify-center ${session.mode === 'work' ? 'bg-accent-blue/20 text-accent-blue' : 'bg-accent-green/20 text-accent-green'}`}
                                                title={`${session.mode} - ${new Date(session.completedAt).toLocaleTimeString()}`}
                                            >
                                                {session.mode === 'work' ? '🍅' : '☕'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={clearHistory}
                                className="w-full mt-4 py-2 text-xs text-text-muted hover:text-accent-red bg-background-elevated hover:bg-background-hover rounded transition-colors"
                            >
                                Clear History
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Timer View */
                    <div className="p-6 flex flex-col items-center relative">
                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 h-1 bg-accent-blue/20 w-full">
                            <div
                                className={`h-full transition-all duration-1000 ${mode === 'work' ? 'bg-accent-blue' : mode === 'shortBreak' ? 'bg-accent-green' : 'bg-accent-amber'}`}
                                style={{ width: `${progress * 100}%` }}
                            />
                        </div>

                        {/* Timer Display */}
                        <div className="text-5xl font-mono font-bold text-text-primary mb-4 tracking-tight">
                            {formatTime(timeLeft)}
                        </div>

                        {/* Today's Session Count */}
                        {todaySessions.length > 0 && (
                            <div className="flex items-center gap-1 mb-4 text-xs text-text-muted">
                                <CheckCircle size={12} className="text-accent-green" />
                                <span>{todaySessions.filter(s => s.mode === 'work').length} completed today</span>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={toggleTimer}
                                className={`p-3 rounded-full transition-all shadow-md ${isActive
                                        ? 'bg-background-elevated text-text-primary hover:bg-background-hover'
                                        : 'bg-accent-blue text-white hover:bg-accent-blue-hover hover:scale-105'
                                    }`}
                                title={isActive ? 'Pause' : 'Start'}
                            >
                                {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                            </button>
                            <button
                                onClick={resetTimer}
                                className="p-3 rounded-full bg-background-elevated text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
                                title="Reset"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </div>

                        {/* Mode Switcher */}
                        <div className="flex gap-1 bg-background-elevated p-1 rounded-lg w-full">
                            <button
                                onClick={() => changeMode('work')}
                                disabled={isActive}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'work' ? 'bg-background shadow-sm text-accent-blue' : 'text-text-muted hover:text-text-primary'} ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Focus
                            </button>
                            <button
                                onClick={() => changeMode('shortBreak')}
                                disabled={isActive}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'shortBreak' ? 'bg-background shadow-sm text-accent-green' : 'text-text-muted hover:text-text-primary'} ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Short
                            </button>
                            <button
                                onClick={() => changeMode('longBreak')}
                                disabled={isActive}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'longBreak' ? 'bg-background shadow-sm text-accent-amber' : 'text-text-muted hover:text-text-primary'} ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Long
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
