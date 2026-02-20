import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addYears,
    subYears,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface CalendarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    onClose?: () => void;
    datesWithLogs?: string[];
}

export default function Calendar({ selectedDate, onSelectDate, onClose, datesWithLogs = [] }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between p-3 border-b border-border">
                {/* Year navigation row */}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCurrentMonth(subYears(currentMonth, 1)); }}
                        className="p-1 hover:bg-background-hover rounded text-text-muted hover:text-text-primary transition-colors"
                        title="Previous year"
                    >
                        <ChevronsLeft size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCurrentMonth(subMonths(currentMonth, 1)); }}
                        className="p-1 hover:bg-background-hover rounded text-text-muted hover:text-text-primary transition-colors"
                        title="Previous month"
                    >
                        <ChevronLeft size={16} />
                    </button>
                </div>

                <h2 className="text-sm font-semibold text-text-primary select-none">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCurrentMonth(addMonths(currentMonth, 1)); }}
                        className="p-1 hover:bg-background-hover rounded text-text-muted hover:text-text-primary transition-colors"
                        title="Next month"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCurrentMonth(addYears(currentMonth, 1)); }}
                        className="p-1 hover:bg-background-hover rounded text-text-muted hover:text-text-primary transition-colors"
                        title="Next year"
                    >
                        <ChevronsRight size={16} />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
        return (
            <div className="grid grid-cols-7 mb-1 px-2">
                {days.map(day => (
                    <div key={day} className="text-center text-[10px] font-medium text-text-muted py-1.5">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const allDays = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="grid grid-cols-7 gap-0.5 px-2 pb-2">
                {allDays.map((dayItem) => {
                    const isSelected = isSameDay(dayItem, selectedDate);
                    const isCurrentMonth = isSameMonth(dayItem, monthStart);
                    const isTodayDate = isToday(dayItem);
                    const dayString = format(dayItem, 'yyyy-MM-dd');
                    const hasLog = datesWithLogs.includes(dayString);

                    return (
                        <button
                            key={dayItem.toString()}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectDate(dayItem);
                                onClose?.();
                            }}
                            className={`
                                h-8 w-8 flex items-center justify-center rounded-lg text-xs transition-all relative
                                ${!isCurrentMonth ? 'text-text-muted/30' : 'text-text-primary'}
                                ${isSelected ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20 scale-105 font-medium' : 'hover:bg-background-hover'}
                                ${isTodayDate && !isSelected ? 'text-accent-blue font-bold ring-1 ring-accent-blue/50' : ''}
                            `}
                        >
                            {format(dayItem, 'd')}
                            {hasLog && (
                                <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-text-primary' : 'bg-accent-green'}`}></div>
                            )}
                            {isTodayDate && !isSelected && !hasLog && (
                                <div className="absolute bottom-0.5 w-1 h-1 bg-accent-blue rounded-full"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-background-card border border-border rounded-xl shadow-xl w-72 animate-fade-in overflow-hidden z-50">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            <div className="p-2 border-t border-border bg-background/50">
                <button
                    onClick={() => {
                        onSelectDate(new Date());
                        onClose?.();
                    }}
                    className="w-full py-1.5 text-xs text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors font-medium"
                >
                    Jump to Today
                </button>
            </div>
        </div>
    );
}
