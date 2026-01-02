import { format, isPast, isToday } from 'date-fns';
import type { Task, TaskStatus } from '../types';
import { Check, Circle, Clock, GripVertical, Calendar, ListTodo } from 'lucide-react';

interface TaskCardProps {
    task: Task;
    onClick: (task: Task) => void;
    onStatusChange: (taskId: number, status: TaskStatus) => void;
    isDragging?: boolean;
}

const statusConfig = {
    not_started: {
        icon: Circle,
        iconColor: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        hoverBg: 'hover:bg-gray-500/20',
    },
    in_progress: {
        icon: Clock,
        iconColor: 'text-accent-amber',
        bgColor: 'bg-accent-amber/10',
        hoverBg: 'hover:bg-accent-amber/20',
    },
    done: {
        icon: Check,
        iconColor: 'text-accent-green',
        bgColor: 'bg-accent-green/10',
        hoverBg: 'hover:bg-accent-green/20',
    },
};

export default function TaskCard({ task, onClick, onStatusChange, isDragging }: TaskCardProps) {
    const config = statusConfig[task.status];
    const StatusIcon = config.icon;
    const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    const handleStatusClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const statusOrder: TaskStatus[] = ['not_started', 'in_progress', 'done'];
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
            className={`rounded-lg p-3 cursor-pointer transition-all duration-200 group hover:bg-background-hover ${isDragging ? 'shadow-elevated scale-[1.02] rotate-1 bg-background-card' : ''
                }`}
        >
            <div className="flex items-center gap-3">
                {/* Drag Handle */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} className="text-text-muted" />
                </div>

                {/* Status Button with Icon */}
                <button
                    onClick={handleStatusClick}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${config.bgColor} ${config.hoverBg}`}
                    title="Click to change status"
                >
                    <StatusIcon size={16} className={config.iconColor} strokeWidth={task.status === 'done' ? 3 : 2} />
                </button>

                {/* Task Title */}
                <span className={`flex-1 font-medium truncate ${task.status === 'done' ? 'text-text-muted' : 'text-text-primary'
                    }`}>
                    {task.title}
                </span>

                {/* Meta info */}
                <div className="flex items-center gap-3 shrink-0">
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
                            {format(new Date(task.due_date), 'MMM d')}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
