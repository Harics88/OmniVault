import React, { useState, useCallback, useEffect } from 'react';
import { X, Check, Circle, Clock, Calendar, Plus, Edit2, Maximize2, Minimize2, Triangle, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import type { Task, TaskStatus, TaskPriority, Subtask } from '../types';
import { format } from 'date-fns';
import RichTextEditor from './RichTextEditor';
import ConfirmModal from './ConfirmModal';
import { useTaskEditor } from '../hooks/useTaskEditor';

interface TaskPanelProps {
    task: Task;
    onClose: () => void;
    onUpdate: (taskId: number, updates: Partial<Task>) => void;
    onDelete: (taskId: number) => void;
    onAddSubtask: (taskId: number, title: string) => void;
    onUpdateSubtask: (taskId: number, subtaskId: number, updates: { completed?: boolean; title?: string }) => void;
    onDeleteSubtask: (taskId: number, subtaskId: number) => void;
    onReorderSubtasks: (taskId: number, subtaskIds: number[]) => void;
    width: number;
    initialEditMode?: boolean;
    onWidthChange: (width: number) => void;
}

const statusOptions: { value: TaskStatus; label: string; icon: typeof Circle; color: string }[] = [
    { value: 'not_started', label: 'Not Started', icon: Circle, color: 'text-text-muted' },
    { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-accent-amber' },
    { value: 'done', label: 'Done', icon: Check, color: 'text-accent-green' },
];

const priorityOptions: { value: TaskPriority; label: string; color: string; icon: any; className?: string }[] = [
    { value: 'low', label: 'Low', color: 'text-blue-400', icon: Triangle, className: 'rotate-180' },
    { value: 'medium', label: 'Medium', color: 'text-emerald-400', icon: Circle },
    { value: 'high', label: 'High', color: 'text-orange-400', icon: Triangle },
];

export default function TaskPanel({
    task,
    onClose,
    onUpdate,
    onDelete,
    onAddSubtask,
    onUpdateSubtask,
    onDeleteSubtask,
    onReorderSubtasks,
    width,
    initialEditMode = false,
    onWidthChange
}: TaskPanelProps) {
    const [newSubtask, setNewSubtask] = useState('');
    const [isResizing, setIsResizing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Use the shared task editor hook
    const {
        editedTask,
        isEditing,
        isSaving,
        dueDateRef,
        startedAtRef,
        completedAtRef,
        startEditing,
        cancelEditing,
        save,
        finishSaving,
        handleStatusChange,
        handlePriorityChange,
        handlePersonalChange,
        handleTitleChange,
        handleDescriptionChange,
        handleDueDateChange,
        handleStartedAtChange,
        handleCompletedAtChange,
        syncSubtasks,
        resetToTask,
    } = useTaskEditor({
        task,
        onSave: onUpdate,
        initialEditMode,
    });

    // Sync editedTask with task prop changes
    useEffect(() => {
        if (isSaving) {
            // Once the task prop updates (e.g. updated_at changes), we can stop saving and exit edit mode
            finishSaving();
            return;
        }

        if (task.id !== editedTask.id) {
            resetToTask(task);
            setIsExpanded(false);
        } else if (isEditing) {
            // Update subtasks from task while editing to keep them live
            syncSubtasks(task.subtasks);
        }
    }, [task, isSaving, isEditing, editedTask.id, finishSaving, resetToTask, syncSubtasks]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);

        const handleMouseMove = (mouseEvent: MouseEvent) => {
            const newWidth = window.innerWidth - mouseEvent.clientX;
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

    const handleAddSubtask = () => {
        if (newSubtask.trim()) {
            onAddSubtask(task.id, newSubtask.trim());
            setNewSubtask('');
        }
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination || !editedTask.subtasks) return;
        if (result.destination.index === result.source.index) return;

        const items = Array.from(editedTask.subtasks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update local state immediately for responsiveness
        syncSubtasks(items);

        const subtaskIds = items.map(item => item.id);
        onReorderSubtasks(task.id, subtaskIds);
    };

    return (
        <>
            {isExpanded && (
                <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={() => setIsExpanded(false)} />
            )}
            <div
                className={`fixed bg-background-card border-l border-border shadow-elevated z-50 animate-slide-in-right ${isResizing ? 'select-none transition-none' : 'transition-all duration-300'
                    } ${isExpanded ? 'inset-4 md:inset-8 lg:inset-16 rounded-2xl border' : 'right-0 top-0 h-full'}`}
                style={isExpanded ? {} : { width: `${width}px` }}
            >
                {!isExpanded && (
                    <div onMouseDown={handleMouseDown} className="absolute left-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-accent-blue/50 transition-colors z-50 pointer-events-auto" />
                )}

                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="font-semibold text-text-primary">Task Details</h2>
                    <div className="flex items-center gap-2">
                        {isEditing && (
                            <div className="flex items-center gap-2 mr-2">
                                <label className="text-sm text-text-muted cursor-pointer select-none" htmlFor="personal-check">Personal</label>
                                <input
                                    id="personal-check"
                                    type="checkbox"
                                    checked={editedTask.is_personal}
                                    onChange={handlePersonalChange}
                                    className="w-4 h-4 rounded border-border text-accent-blue focus:ring-accent-blue cursor-pointer"
                                />
                            </div>
                        )}
                        {!isEditing && task.is_personal && (
                            <span className="text-xs font-medium text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full mr-2">Personal</span>
                        )}
                        {!isEditing && (
                            <button onClick={startEditing} className="p-2 hover:bg-background-hover rounded-lg text-text-muted hover:text-accent-blue"><Edit2 size={18} /></button>
                        )}
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-background-hover rounded-lg text-text-muted hover:text-accent-blue">
                            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-background-hover rounded-lg"><X size={20} className="text-text-muted" /></button>
                    </div>
                </div>

                <div className={`p-4 space-y-5 overflow-y-auto ${isExpanded ? 'h-[calc(100%-80px)] max-w-4xl mx-auto' : 'h-[calc(100%-130px)]'}`}>
                    <div>
                        <label className="block text-sm text-text-muted mb-2">Title</label>
                        {isEditing ? (
                            <input type="text" value={editedTask.title} onChange={handleTitleChange} className="input text-lg font-medium" />
                        ) : (
                            <h3 className="text-lg font-medium text-text-primary py-2 px-1">{task.title}</h3>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm text-text-muted mb-2">Status</label>
                            <div className="flex gap-2">
                                {statusOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = (isEditing ? editedTask.status : task.status)?.toLowerCase() === option.value.toLowerCase();
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => handleStatusChange(option.value)}
                                            disabled={!isEditing}
                                            className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg transition-all ${isSelected ? 'bg-accent-blue/10 border border-accent-blue' : 'bg-background hover:bg-background-hover border border-border'
                                                } ${!isEditing && !isSelected ? 'opacity-30' : ''}`}
                                        >
                                            <Icon size={16} className={isSelected ? option.color : 'text-text-muted'} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm text-text-muted mb-2">Priority</label>
                            <div className="flex gap-2">
                                {priorityOptions.map((option) => {
                                    const isSelected = (isEditing ? editedTask.priority : task.priority)?.toLowerCase() === option.value.toLowerCase();
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => handlePriorityChange(option.value)}
                                            disabled={!isEditing}
                                            className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg transition-all ${isSelected ? 'bg-accent-blue/10 border border-accent-blue' : 'bg-background hover:bg-background-hover border border-border'
                                                } ${!isEditing && !isSelected ? 'opacity-30' : ''}`}
                                        >
                                            <option.icon
                                                size={16}
                                                className={`${isSelected ? option.color : 'text-text-muted'} ${option.className || ''}`}
                                                fill={isSelected ? "currentColor" : "none"}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="group/field">
                        <label className="block text-sm text-text-muted mb-2 group-hover/field:text-text-primary transition-colors">Due Date</label>
                        <div className="flex items-center gap-2 py-2 px-1 relative">
                            <Calendar size={16} className="text-accent-blue shrink-0" />
                            <div className="flex-1 text-sm text-text-primary">
                                {isEditing ? (
                                    <div className="relative min-h-[1.5rem] flex items-center cursor-pointer" onClick={() => dueDateRef.current?.showPicker()}>
                                        <span className="text-text-primary pointer-events-none">
                                            {editedTask.due_date ? format(new Date(editedTask.due_date), 'MMM d, yyyy') : 'Set due date'}
                                        </span>
                                        <input
                                            ref={dueDateRef}
                                            type="datetime-local"
                                            value={editedTask.due_date ? new Date(editedTask.due_date).toISOString().slice(0, 16) : ''}
                                            onChange={handleDueDateChange}
                                            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                                        />
                                    </div>
                                ) : (
                                    <span className="font-medium">
                                        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'Not set'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="group/field">
                            <label className="block text-sm text-text-muted mb-2 group-hover/field:text-text-primary transition-colors">Started At</label>
                            <div className="flex items-center gap-2 py-2 px-1 relative">
                                <Clock size={16} className="text-accent-amber shrink-0" />
                                <div className="flex-1 text-sm text-text-primary">
                                    {isEditing ? (
                                        <div className="relative min-h-[1.5rem] flex items-center cursor-pointer" onClick={() => startedAtRef.current?.showPicker()}>
                                            <span className="text-text-primary pointer-events-none">
                                                {editedTask.started_at ? format(new Date(editedTask.started_at), 'MMM d, yyyy') : 'Not started'}
                                            </span>
                                            <input
                                                ref={startedAtRef}
                                                type="datetime-local"
                                                value={editedTask.started_at ? new Date(editedTask.started_at).toISOString().slice(0, 16) : ''}
                                                onChange={handleStartedAtChange}
                                                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                                            />
                                        </div>
                                    ) : (
                                        <span className="font-medium">
                                            {task.started_at ? format(new Date(task.started_at), 'MMM d, yyyy') : 'Not started'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="group/field">
                            <label className="block text-sm text-text-muted mb-2 group-hover/field:text-text-primary transition-colors">Completed At</label>
                            <div className="flex items-center gap-2 py-2 px-1 relative">
                                <Check size={16} className="text-accent-green shrink-0" />
                                <div className="flex-1 text-sm text-text-primary">
                                    {isEditing ? (
                                        <div className="relative min-h-[1.5rem] flex items-center cursor-pointer" onClick={() => completedAtRef.current?.showPicker()}>
                                            <span className="text-text-primary pointer-events-none">
                                                {editedTask.completed_at ? format(new Date(editedTask.completed_at), 'MMM d, yyyy') : 'Not completed'}
                                            </span>
                                            <input
                                                ref={completedAtRef}
                                                type="datetime-local"
                                                value={editedTask.completed_at ? new Date(editedTask.completed_at).toISOString().slice(0, 16) : ''}
                                                onChange={handleCompletedAtChange}
                                                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                                            />
                                        </div>
                                    ) : (
                                        <span className="font-medium">
                                            {task.completed_at ? format(new Date(task.completed_at), 'MMM d, yyyy') : 'Not completed'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-text-muted mb-2">Description</label>
                        <RichTextEditor
                            content={isEditing ? (editedTask.description || '') : (task.description || '')}
                            onChange={handleDescriptionChange}
                            isEditable={isEditing}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-text-muted mb-2">Subtasks</label>
                        <div className="space-y-1">
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="subtasks-panel">
                                    {(provided: any) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                                            {editedTask.subtasks?.map((subtask, index) => (
                                                <Draggable
                                                    key={subtask.id}
                                                    draggableId={subtask.id.toString()}
                                                    index={index}
                                                >
                                                    {(provided: any, snapshot: any) => (
                                                        <SubtaskItem
                                                            subtask={subtask}
                                                            onToggle={() => {
                                                                const newCompleted = !subtask.completed;
                                                                onUpdateSubtask(task.id, subtask.id, { completed: newCompleted });
                                                                // Optimistic update for toggling
                                                                syncSubtasks(editedTask.subtasks?.map(s => s.id === subtask.id ? { ...s, completed: newCompleted } : s));
                                                            }}
                                                            onDelete={() => onDeleteSubtask(task.id, subtask.id)}
                                                            onUpdateTitle={(title) => onUpdateSubtask(task.id, subtask.id, { title })}
                                                            isEditing={isEditing}
                                                            dragHandleProps={provided.dragHandleProps}
                                                            innerRef={provided.innerRef}
                                                            draggableProps={provided.draggableProps}
                                                            isDragging={snapshot.isDragging}
                                                        />
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                            {isEditing && (
                                <div className="flex items-center gap-2">
                                    <Plus size={14} className="text-text-muted" />
                                    <input
                                        type="text"
                                        value={newSubtask}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubtask(e.target.value)}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddSubtask()}
                                        placeholder="Add a subtask..."
                                        className="bg-transparent border-none text-sm outline-none w-full"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background-card flex gap-3">
                    {isEditing ? (
                        <>
                            <button onClick={save} className="flex-1 bg-accent-green text-white py-2 rounded-lg hover:bg-accent-green/90">Save</button>
                            <button onClick={cancelEditing} className="flex-1 bg-background-elevated py-2 rounded-lg hover:bg-background-hover border border-border">Cancel</button>
                        </>
                    ) : (
                        <>
                            <button onClick={startEditing} className="flex-1 bg-background-elevated py-2 rounded-lg hover:bg-background-hover border border-border">Edit</button>
                            <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 text-accent-red hover:bg-accent-red/10 rounded-lg">Delete</button>
                        </>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => { onDelete(task.id); setShowDeleteConfirm(false); }}
                title="Delete Task"
                message="Are you sure you want to delete this task?"
            />
        </>
    );
}

function SubtaskItem({
    subtask,
    onToggle,
    onDelete,
    onUpdateTitle,
    isEditing,
    dragHandleProps,
    innerRef,
    draggableProps,
    isDragging
}: {
    subtask: Subtask;
    onToggle: () => void;
    onDelete: () => void;
    onUpdateTitle: (title: string) => void;
    isEditing: boolean;
    dragHandleProps: any;
    innerRef: (el: HTMLElement | null) => void;
    draggableProps: any;
    isDragging: boolean;
}) {
    return (
        <div
            ref={innerRef}
            {...draggableProps}
            className={`flex items-center gap-2 group py-1 px-2 rounded-lg transition-colors ${isDragging ? 'bg-background-elevated shadow-lg' : 'hover:bg-background-hover/50'}`}
        >
            <div {...dragHandleProps} className="text-text-muted hover:text-text-primary cursor-grab active:cursor-grabbing">
                <GripVertical size={14} />
            </div>
            <button
                onClick={() => isEditing && onToggle()}
                disabled={!isEditing}
                className={`w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-all ${subtask.completed ? 'bg-accent-green border-accent-green' : 'border-border hover:border-text-muted'
                    } ${!isEditing ? 'cursor-default' : ''}`}
            >
                {subtask.completed && <Check size={12} className="text-white" strokeWidth={3} />}
            </button>
            {isEditing ? (
                <textarea
                    defaultValue={subtask.title}
                    onBlur={(e) => {
                        if (e.target.value !== subtask.title) {
                            onUpdateTitle(e.target.value);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            (e.target as HTMLTextAreaElement).blur();
                        }
                    }}
                    className="flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 text-text-primary leading-relaxed resize-none min-h-[1.5rem] overflow-hidden"
                    rows={1}
                    onInput={(e) => {
                        (e.target as HTMLTextAreaElement).style.height = 'auto';
                        (e.target as HTMLTextAreaElement).style.height = (e.target as HTMLTextAreaElement).scrollHeight + 'px';
                    }}
                    ref={(el) => {
                        if (el) {
                            el.style.height = 'auto';
                            el.style.height = el.scrollHeight + 'px';
                        }
                    }}
                />
            ) : (
                <span className={`flex-1 text-sm ${subtask.completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>{subtask.title}</span>
            )}
            {isEditing && (
                <button
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent-red/10 text-text-muted hover:text-accent-red rounded transition-all"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
