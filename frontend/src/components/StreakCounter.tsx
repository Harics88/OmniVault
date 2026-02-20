import React from 'react';
import { Flame } from 'lucide-react';

interface StreakCounterProps {
    streakDays: number;
    className?: string;
}

export const StreakCounter: React.FC<StreakCounterProps> = React.memo(({
    streakDays,
    className = ''
}) => {
    if (streakDays === 0) return null;

    // Determine flame color based on streak length
    const getFlameColor = () => {
        if (streakDays >= 30) return '#F85149'; // Red hot
        if (streakDays >= 14) return '#F59E0B'; // Orange
        if (streakDays >= 7) return '#D29922'; // Amber
        return '#7D8590'; // Gray (starting out)
    };

    const flameColor = getFlameColor();

    return (
        <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold ${className}`}
            style={{
                backgroundColor: `${flameColor}15`,
                color: flameColor
            }}
            title={`${streakDays} day logging streak!`}
        >
            <Flame size={14} className="animate-streak-glow" />
            <span>{streakDays}</span>
        </div>
    );
});

StreakCounter.displayName = 'StreakCounter';

// Utility function to calculate streak from date strings
export const calculateStreak = (dates: string[]): number => {
    if (!dates || dates.length === 0) return 0;

    // Sort descending
    const sortedDates = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Check if today or yesterday has entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If neither today nor yesterday has entries, streak is broken
    if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
        return 0;
    }

    // Count consecutive days
    let streak = 0;
    let checkDate = sortedDates.includes(todayStr) ? today : yesterday;

    while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (sortedDates.includes(checkStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
};

// Legacy wrapper for backward compatibility with full log objects
export const calculateStreakFromLogs = (logs: { date: string; log_entries?: any[] }[]): number => {
    if (!logs || logs.length === 0) return 0;
    const dates = logs
        .filter(log => log.log_entries && log.log_entries.length > 0)
        .map(log => log.date);
    return calculateStreak(dates);
};

export default StreakCounter;
