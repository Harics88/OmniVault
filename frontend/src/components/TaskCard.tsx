import React from 'react';
import { format, isPast, isToday } from 'date-fns';
import type { Task, TaskStatus } from '../types';
import { Check, Circle, Clock, GripVertical, Calendar, ListTodo, Triangle } from 'lucide-react';

interface TaskCardProps {
    task: Task;
    onClick: (task: Task) => void;
    onStatusChange: (taskId: number, status: TaskStatus) => void;
    isDragging?: boolean;
    isCompact?: boolean;
    disableStatusClick?: boolean;
    isSelected?: boolean;
    onSelect?: (taskId: number) => void;
}

const statusConfig: Record<string, any> = {
    NOT_STARTED: { icon: Circle, iconColor: 'text-gray-400', bgColor: 'bg-gray-500/10', hoverBg: 'hover:bg-gray-500/20' },
    IN_PROGRESS: { icon: Clock, iconColor: 'text-accent-amber', bgColor: 'bg-accent-amber/10', hoverBg: 'hover:bg-accent-amber/20' },
    DONE: { icon: Check, iconColor: 'text-accent-green', bgColor: 'bg-accent-green/10', hoverBg: 'hover:bg-accent-green/20' },
};

const priorityConfig: Record<string, { color: string, icon: any, className?: string }> = {
    LOW: { color: 'text-blue-400', icon: Triangle, className: 'rotate-180' },
    MEDIUM: { color: 'text-emerald-400', icon: Circle },
    HIGH: { color: 'text-orange-400', icon: Triangle },
};

const TaskCard = React.memo(({ task, onClick, onStatusChange, isDragging, isCompact, disableStatusClick, isSelected, onSelect }: TaskCardProps) => {

    const statusKey = (task.status || 'not_started').toUpperCase();
    const config = statusConfig[statusKey] || statusConfig.NOT_STARTED;
    const StatusIcon = config.icon;
    const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    // Database uses UPPERCASE priority
    const priorityKey = (task.priority || 'MEDIUM').toUpperCase();
    const pConfig = priorityConfig[priorityKey] || priorityConfig.MEDIUM;
    const PriorityIcon = pConfig.icon;

    const handleStatusClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disableStatusClick) return;
        const statusOrder: TaskStatus[] = ['not_started' as any, 'in_progress' as any, 'done' as any];
        const currentIndex = statusOrder.indexOf(task.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        onStatusChange(task.id, nextStatus);
    };

    const getDueDateColor = () => {
        if (!task.due_date) return '';
        const dueDate = new Date(task.due_date);
        if (task.status === 'done') return 'text-text-muted';
        if (isPast(dueDate) && !isToday(dueDate)) return 'text-accent-red';
        if (isToday(dueDate)) return 'text-accent-amber';
        return 'text-text-muted';
    };

    return (
        <div
            onClick={() => onClick(task)}
            className={`rounded-lg cursor-pointer transition-all duration-200 group hover:bg-background-hover ${isCompact ? 'p-1.5' : 'p-3'
                } ${isDragging ? 'shadow-elevated scale-[1.02] rotate-1 bg-background-card' : ''} ${isSelected ? 'bg-accent-blue/10 border-accent-blue/30 ring-1 ring-accent-blue/30' : ''}`}
        >
            <div className="flex items-center gap-3">
                {/* Selection Checkbox */}
                <div
                    className={`w-4 h-4 rounded border transition-all flex items-center justify-center shrink-0 ${isSelected ? 'bg-accent-blue border-accent-blue' : 'border-border group-hover:border-text-muted opacity-0 group-hover:opacity-100'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onSelect) onSelect(task.id);
                    }}
                >
                    {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                </div>

                {/* Drag Handle */}
                {!isCompact && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                        <GripVertical size={14} className="text-text-muted" />
                    </div>
                )}

                {/* Status Button with Icon */}
                <button
                    onClick={handleStatusClick}
                    className={`${isCompact ? 'w-5 h-5' : 'w-7 h-7'} rounded-lg flex items-center justify-center shrink-0 transition-all ${config.bgColor} ${disableStatusClick ? '' : config.hoverBg} ${disableStatusClick ? 'cursor-default' : ''}`}
                    title={disableStatusClick ? 'Status' : "Click to change status"}
                >
                    <StatusIcon size={isCompact ? 12 : 16} className={config.iconColor} strokeWidth={task.status === 'done' ? 3 : 2} />
                </button>

                {/* Task Title */}
                <span className={`flex-1 font-medium truncate ${isCompact ? 'text-[13px]' : ''} ${task.status === 'done' ? 'text-text-muted/60 line-through' : 'text-text-primary'
                    }`}>
                    {task.title}
                </span>

                {/* Meta info */}
                {!isCompact && (
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Priority */}
                        <div title={`Priority: ${priorityKey}`}>
                            <PriorityIcon
                                size={12}
                                className={`${pConfig.color} ${pConfig.className || ''}`}
                                fill="currentColor"
                            />
                        </div>

                        {/* Subtask count */}
                        {totalSubtasks > 0 && (
                            <span className={`flex items-center gap-1 text-xs ${completedSubtasks === totalSubtasks ? 'text-accent-green' : 'text-text-muted'
                                }`}>
                                <ListTodo size={12} />
                                {completedSubtasks}/{totalSubtasks}
                            </span>
                        )}

                        {/* Due date */}
                        {task.due_date && (
                            <span className={`flex items-center gap-1 text-xs ${getDueDateColor()}`}>
                                <Calendar size={12} />
                                {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '--'}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

export default TaskCard;
