import React from 'react';
import { format, isPast, isToday } from 'date-fns';
import { Circle, Clock, Check, Trash2, Edit2, Calendar, Triangle } from 'lucide-react';
import type { Task, TaskStatus } from '../types';

interface TaskRowProps {
    task: Task;
    onClick: (task: Task) => void;
    onStatusChange: (taskId: number, status: TaskStatus) => void;
    onDelete: (taskId: number) => void;
    onEditClick: (task: Task) => void;
    isMuted?: boolean;
}

const statusConfig: Record<string, any> = {
    NOT_STARTED: { label: 'Not Started', bg: 'bg-background-elevated', text: 'text-text-muted', icon: Circle, border: 'border-border' },
    IN_PROGRESS: { label: 'In Progress', bg: 'bg-accent-amber/10', text: 'text-accent-amber', icon: Clock, border: 'border-accent-amber/20' },
    DONE: { label: 'Completed', bg: 'bg-accent-green/10', text: 'text-accent-green', icon: Check, border: 'border-accent-green/20' },
};

// Priority mappings
const priorityConfig: Record<string, { color: string, fill: string, icon: any, className?: string }> = {
    LOW: { color: 'text-blue-400', fill: 'currentColor', icon: Triangle, className: 'rotate-180' },
    MEDIUM: { color: 'text-emerald-400', fill: 'currentColor', icon: Circle },
    HIGH: { color: 'text-orange-400', fill: 'currentColor', icon: Triangle },
};

export default function TaskRow({ task, onClick, onStatusChange, onDelete, onEditClick, isMuted }: TaskRowProps) {
    const statusKey = (task.status || 'not_started').toUpperCase();
    const config = statusConfig[statusKey] || statusConfig.NOT_STARTED;

    const priorityKey = (task.priority || 'medium').toUpperCase();
    const priorityStyle = priorityConfig[priorityKey] || priorityConfig.MEDIUM;

    // Progress Calculation
    const totalSubtasks = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
    const progress = totalSubtasks === 0
        ? (statusKey === 'DONE' ? 100 : (statusKey === 'IN_PROGRESS' ? 25 : 0))
        : Math.round((completedSubtasks / totalSubtasks) * 100);

    // Indicator Color (Left Strip)
    const indicatorColor = priorityKey === 'HIGH' ? 'bg-orange-400' :
        priorityKey === 'MEDIUM' ? 'bg-emerald-400' : 'bg-blue-400';

    const handleStatusClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const statusOrder: TaskStatus[] = ['NOT_STARTED' as any, 'IN_PROGRESS' as any, 'DONE' as any];
        const currentIndex = statusOrder.indexOf(statusKey as any);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        onStatusChange(task.id, nextStatus);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this task?')) {
            onDelete(task.id);
        }
    };

    const DateDisplay = ({ label, dateValue, status }: { label: string, dateValue?: string | Date | null, status?: string }) => {
        if (!dateValue) return <span className="text-text-muted/30 italic text-xs">--</span>;

        const dateObj = new Date(dateValue);
        const isOverdue = label === 'Due' && isPast(dateObj) && !isToday(dateObj) && status !== 'DONE';

        return (
            <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-rose-500' : 'text-text-muted'} group/date`}>
                <Calendar size={12} className="opacity-60 group-hover/date:opacity-100 transition-opacity" />
                <span className="text-xs font-medium">
                    {format(dateObj, 'MMM d, yyyy, h:mm a')}
                </span>
            </div>
        );
    };

    return (
        <div
            onClick={() => onClick(task)}
            className={`group relative flex items-center gap-4 p-4 bg-background-card hover:bg-background-hover border-b border-border last:border-0 transition-all cursor-pointer ${isMuted ? 'opacity-50' : ''}`}
        >
            {/* Left Indicator Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${indicatorColor}`} />

            {/* Title Section */}
            <div className="flex-1 min-w-0 ml-2">
                <h4 className={`font-medium truncate ${statusKey === 'DONE' ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                    {task.title}
                </h4>
            </div>

            {/* Due Date */}
            <div className="w-48 flex-shrink-0">
                <DateDisplay label="Due" dateValue={task.due_date} status={statusKey} />
            </div>

            {/* Started At */}
            <div className="w-48 flex-shrink-0">
                <DateDisplay label="Started" dateValue={task.started_at} />
            </div>

            {/* Completed At */}
            <div className="w-48 flex-shrink-0">
                <DateDisplay label="Completed" dateValue={task.completed_at} />
            </div>

            {/* Status Badge */}
            <div className="w-32 flex-shrink-0">
                <button
                    onClick={handleStatusClick}
                    className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit transition-all ${config.bg} ${config.text} ${config.border} hover:brightness-110 active:scale-95`}
                >
                    <config.icon size={12} />
                    {config.label}
                </button>
            </div>

            {/* Priority */}
            <div className="w-20 flex-shrink-0 flex justify-center">
                <div className="group/priority relative">
                    <priorityStyle.icon
                        size={16}
                        className={`${priorityStyle.color} ${priorityStyle.className || ''} transition-transform group-hover/priority:scale-110`}
                        fill={priorityStyle.fill}
                    />
                </div>
            </div>

            {/* Progress */}
            <div className="w-32 flex-shrink-0 flex items-center">
                <div className="flex-1 h-2 bg-background-elevated/50 rounded-full overflow-hidden border border-border/10">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-400'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="w-20 flex-shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onEditClick(task); }}
                    className="p-1.5 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg text-text-muted transition-colors"
                    title="Edit Task"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={handleDelete}
                    className="p-1.5 hover:bg-red-500/10 hover:text-rose-500 rounded-lg text-text-muted transition-colors"
                    title="Delete Task"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
