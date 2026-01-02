import { useState, useCallback, useRef } from 'react';
import { X, Check, Circle, Clock, Trash2, Calendar, Plus } from 'lucide-react';
import type { Task, TaskStatus, Subtask } from '../types';
import { format } from 'date-fns';
import RichTextEditor from './RichTextEditor';

interface TaskPanelProps {
    task: Task;
    onClose: () => void;
    onUpdate: (taskId: number, updates: Partial<Task>) => void;
    onDelete: (taskId: number) => void;
    onAddSubtask: (taskId: number, title: string) => void;
    onUpdateSubtask: (taskId: number, subtaskId: number, updates: { completed?: boolean; title?: string }) => void;
    onDeleteSubtask: (taskId: number, subtaskId: number) => void;
    width: number;
    onWidthChange: (width: number) => void;
}

const statusOptions: { value: TaskStatus; label: string; icon: typeof Circle; color: string }[] = [
    { value: 'not_started', label: 'Not Started', icon: Circle, color: 'text-text-muted' },
    { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-accent-amber' },
    { value: 'done', label: 'Done', icon: Check, color: 'text-accent-green' },
];

export default function TaskPanel({
    task,
    onClose,
    onUpdate,
    onDelete,
    onAddSubtask,
    onUpdateSubtask,
    onDeleteSubtask,
    width,
    onWidthChange
}: TaskPanelProps) {
    const [newSubtask, setNewSubtask] = useState('');
    const [isResizing, setIsResizing] = useState(false);
    const descriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);

        const handleMouseMove = (mouseEvent: MouseEvent) => {
            const newWidth = window.innerWidth - mouseEvent.clientX;
            // Limit width between 300px and 800px
            if (newWidth >= 300 && newWidth <= 800) {
                onWidthChange(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [onWidthChange]);

    // Debounced description save
    const handleDescriptionChange = useCallback((newDescription: string) => {
        if (descriptionTimeoutRef.current) {
            clearTimeout(descriptionTimeoutRef.current);
        }
        descriptionTimeoutRef.current = setTimeout(() => {
            if (newDescription !== task.description) {
                onUpdate(task.id, { description: newDescription });
            }
        }, 500); // Debounce 500ms
    }, [task.id, task.description, onUpdate]);

    const handleStatusChange = (status: TaskStatus) => {
        onUpdate(task.id, { status });
    };

    const handleTitleChange = (e: React.FocusEvent<HTMLInputElement>) => {
        const newTitle = e.target.value.trim();
        if (newTitle && newTitle !== task.title) {
            onUpdate(task.id, { title: newTitle });
        }
    };



    const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onUpdate(task.id, { due_date: value || null });
    };

    const handleAddSubtask = () => {
        if (newSubtask.trim()) {
            onAddSubtask(task.id, newSubtask.trim());
            setNewSubtask('');
        }
    };

    const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSubtask();
        }
    };

    return (
        <div
            className={`fixed right-0 top-0 h-full bg-background-card border-l border-border shadow-elevated z-40 animate-slide-in-right ${isResizing ? 'select-none transition-none' : ''}`}
            style={{ width: `${width}px` }}
        >
            {/* Resize Handle */}
            <div
                onMouseDown={handleMouseDown}
                className="absolute left-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-accent-blue/50 transition-colors z-50 group"
            >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-10 bg-border group-hover:bg-accent-blue rounded-full opacity-50" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-semibold text-text-primary">Task Details</h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-background-hover rounded-lg transition-colors"
                >
                    <X size={20} className="text-text-muted" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-5 overflow-y-auto h-[calc(100%-130px)]">
                {/* Title */}
                <div>
                    <label className="block text-sm text-text-muted mb-2">Title</label>
                    <input
                        type="text"
                        defaultValue={task.title}
                        onBlur={handleTitleChange}
                        className="input text-lg font-medium"
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm text-text-muted mb-2">Status</label>
                    <div className="flex gap-2">
                        {statusOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = task.status === option.value;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleStatusChange(option.value)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isSelected
                                        ? 'bg-accent-blue/10 border border-accent-blue'
                                        : 'bg-background hover:bg-background-hover border border-border'
                                        }`}
                                >
                                    <Icon size={16} className={isSelected ? 'text-accent-blue' : option.color} />
                                    <span className={`text-sm ${isSelected ? 'text-accent-blue' : 'text-text-secondary'}`}>
                                        {option.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Started and Completed Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-text-muted mb-2">Started At</label>
                        <div className="text-sm text-text-primary px-3 py-2 bg-background border border-border rounded-lg flex items-center gap-2">
                            <Clock size={14} className="text-accent-amber" />
                            {task.started_at ? format(new Date(task.started_at), 'MMM d, p') : 'Not started'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-text-muted mb-2">Completed At</label>
                        <div className="text-sm text-text-primary px-3 py-2 bg-background border border-border rounded-lg flex items-center gap-2">
                            <Check size={14} className="text-accent-green" />
                            {task.completed_at ? format(new Date(task.completed_at), 'MMM d, p') : 'Not completed'}
                        </div>
                    </div>
                </div>

                {/* Due Date */}
                <div>
                    <label className="block text-sm text-text-muted mb-2">
                        <Calendar size={14} className="inline mr-1.5" />
                        Due Date (optional)
                    </label>
                    <input
                        type="date"
                        value={task.due_date || ''}
                        onChange={handleDueDateChange}
                        className="input"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm text-text-muted mb-2">Description</label>
                    <RichTextEditor
                        content={task.description || ''}
                        onChange={handleDescriptionChange}
                        placeholder="Add a description with formatting, lists, links, or images..."
                    />
                </div>

                {/* Subtasks */}
                <div>
                    <label className="block text-sm text-text-muted mb-2">
                        Subtasks ({task.subtasks?.filter(s => s.completed).length || 0}/{task.subtasks?.length || 0})
                    </label>

                    <div className="space-y-2">
                        {task.subtasks?.map((subtask) => (
                            <SubtaskItem
                                key={subtask.id}
                                subtask={subtask}
                                onToggle={() => onUpdateSubtask(task.id, subtask.id, { completed: !subtask.completed })}
                                onDelete={() => onDeleteSubtask(task.id, subtask.id)}
                            />
                        ))}

                        {/* Add subtask input */}
                        <div className="flex items-center gap-2">
                            <button className="w-5 h-5 rounded border border-dashed border-border flex items-center justify-center">
                                <Plus size={12} className="text-text-muted" />
                            </button>
                            <input
                                type="text"
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                onKeyDown={handleSubtaskKeyDown}
                                placeholder="Add a subtask..."
                                className="flex-1 bg-transparent border-none text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                            />
                            {newSubtask && (
                                <button
                                    onClick={handleAddSubtask}
                                    className="text-xs text-accent-blue hover:text-accent-blue-hover"
                                >
                                    Add
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Metadata */}
                <div className="pt-4 border-t border-border space-y-2 text-sm text-text-muted">
                    <p>Created: {format(new Date(task.created_at), 'PPpp')}</p>
                    <p>Updated: {format(new Date(task.updated_at), 'PPpp')}</p>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background-card">
                <button
                    onClick={() => onDelete(task.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                >
                    <Trash2 size={16} />
                    <span>Delete Task</span>
                </button>
            </div>
        </div>
    );
}

// Subtask item component
function SubtaskItem({
    subtask,
    onToggle,
    onDelete
}: {
    subtask: Subtask;
    onToggle: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="flex items-center gap-2 group py-1">
            <button
                onClick={onToggle}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${subtask.completed
                    ? 'bg-accent-green border-accent-green'
                    : 'border-border hover:border-text-muted'
                    }`}
            >
                {subtask.completed && (
                    <Check size={12} className="text-white" strokeWidth={3} />
                )}
            </button>
            <span className={`flex-1 text-sm ${subtask.completed ? 'text-text-muted' : 'text-text-primary'
                }`}>
                {subtask.title}
            </span>
            <button
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background-hover rounded transition-all"
            >
                <X size={14} className="text-text-muted" />
            </button>
        </div>
    );
}
