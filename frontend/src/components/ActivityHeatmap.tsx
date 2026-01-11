import { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import { format, subDays } from 'date-fns';
import { Activity } from 'lucide-react';
import axios from 'axios';

interface ActivityStat {
    date: string;
    count: number;
    level: number;
}

export default function ActivityHeatmap() {
    const [stats, setStats] = useState<ActivityStat[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/system/activity');
                setStats(response.data);
            } catch (error) {
                console.warn('Activity endpoint not found, falling back to empty/mock', error);
                setStats([]);
            }
        };
        fetchStats();
    }, []);

    const today = new Date();

    return (
        <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Activity size={20} className="text-accent-green" />
                <h2 className="text-lg font-semibold text-text-primary">Activity</h2>
            </div>

            <div className="w-full overflow-x-auto">
                <div className="min-w-[600px]">
                    <CalendarHeatmap
                        startDate={subDays(today, 120)}
                        endDate={today}
                        values={stats}
                        classForValue={(value: ActivityStat | null) => {
                            if (!value || value.count === 0) {
                                return 'color-empty';
                            }
                            return `color-scale-${value.level}`;
                        }}
                        tooltipDataAttrs={(value: { date: string; count: number } | null) => {
                            if (!value || !value.date) return null;
                            return {
                                'data-tooltip-id': 'heatmap-tooltip',
                                'data-tooltip-content': `${format(new Date(value.date), 'MMM d, yyyy')}: ${value.count} contributions`,
                            };
                        }}
                        showWeekdayLabels
                    />
                    <Tooltip id="heatmap-tooltip" />
                </div>
            </div>

            <style>{`
                .react-calendar-heatmap .color-empty { fill: rgba(128, 128, 128, 0.1); }
                .react-calendar-heatmap .color-scale-1 { fill: rgba(34, 197, 94, 0.2); }
                .react-calendar-heatmap .color-scale-2 { fill: rgba(34, 197, 94, 0.4); }
                .react-calendar-heatmap .color-scale-3 { fill: rgba(34, 197, 94, 0.6); }
                .react-calendar-heatmap .color-scale-4 { fill: rgba(34, 197, 94, 0.8); }
                .react-calendar-heatmap text { fill: #888; font-size: 10px; }
            `}</style>
        </div>
    );
}
