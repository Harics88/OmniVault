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
        <div className="card p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Activity size={18} className="text-emerald-500" />
                    <h2 className="font-bold text-text-primary text-sm uppercase tracking-wider">Activity Heatmap</h2>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-background-elevated" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/20" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/40" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/60" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/80" />
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="w-full mt-auto">
                <div className="heatmap-container">
                    <CalendarHeatmap
                        startDate={subDays(today, 200)}
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
                                'data-tooltip-content': `${format(new Date(value.date), 'MMM d, yyyy')}: ${value.count} activity points`,
                            };
                        }}
                    />
                    <Tooltip id="heatmap-tooltip" className="z-50" />
                </div>
            </div>

            <style>{`
                .heatmap-container .react-calendar-heatmap .color-empty { 
                    fill: var(--bg-elevated); 
                    rx: 2px;
                    ry: 2px;
                }
                .heatmap-container .react-calendar-heatmap .color-scale-1 { fill: rgba(16, 185, 129, 0.2); rx: 2px; ry: 2px; }
                .heatmap-container .react-calendar-heatmap .color-scale-2 { fill: rgba(16, 185, 129, 0.4); rx: 2px; ry: 2px; }
                .heatmap-container .react-calendar-heatmap .color-scale-3 { fill: rgba(16, 185, 129, 0.6); rx: 2px; ry: 2px; }
                .heatmap-container .react-calendar-heatmap .color-scale-4 { fill: rgba(16, 185, 129, 0.8); rx: 2px; ry: 2px; }
                .heatmap-container .react-calendar-heatmap text { 
                    fill: var(--text-muted); 
                    font-size: 8px; 
                    font-weight: 500;
                }
                .react-calendar-heatmap rect:hover {
                    stroke: var(--accent-blue);
                    stroke-width: 1px;
                }
            `}</style>
        </div>
    );
}
