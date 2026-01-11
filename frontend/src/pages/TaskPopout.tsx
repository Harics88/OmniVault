import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check, Circle, Clock, Trash2, Calendar, Plus, Save, Edit2, Triangle, ListTodo, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { Task, TaskStatus, TaskPriority, Subtask } from '../types';
import { format } from 'date-fns';
import { tasksApi } from '../lib/api';
import RichTextEditor from '../components/RichTextEditor';
import ConfirmModal from '../components/ConfirmModal';

const statusOptions: { value: TaskStatus; label: string; icon: typeof Circle; color: string }[] = [
    { value: 'not_started', label: 'Not Started', icon: Circle, color: 'text-text-muted' },
    { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-accent-amber' },
    { value: 'done', label: 'Done', icon: Check, color: 'text-accent-green' },
];

const priorityOptions: { value: TaskPriority; label: string; icon: any; color: string; className?: string }[] = [
    { value: 'low', label: 'Low', icon: Triangle, color: 'text-blue-400', className: 'rotate-180' },
    { value: 'medium', label: 'Medium', icon: Circle, color: 'text-emerald-400' },
    { value: 'high', label: 'High', icon: Triangle, color: 'text-orange-400' },
];

export default function TaskPopout() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const taskId = id ? parseInt(id) : null;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') navigate(-1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    const [newSubtask, setNewSubtask] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const dueDateRef = useRef<HTMLInputElement>(null);
    const startedAtRef = useRef<HTMLInputElement>(null);
    const completedAtRef = useRef<HTMLInputElement>(null);

    // Fetch task data
    const { data: task, isLoading, error } = useQuery({
        queryKey: ['task', taskId],
        queryFn: () => tasksApi.getById(taskId!),
        enabled: !!taskId,
    });

    const [editedTask, setEditedTask] = useState<Task | null>(null);

    // Sync editedTask with task data
    useEffect(() => {
        if (!task) return;

        if (!isEditing || task.id !== editedTask?.id) {
            setEditedTask(task);
        } else {
            // Update subtasks from task while editing to keep them live (for sync with backend/panel)
            setEditedTask((prev: Task | null) => prev ? { ...prev, subtasks: task.subtasks } : task);
        }
    }, [task, isEditing, editedTask?.id]);

    // Mutations
    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: number; updates: Partial<Task> }) =>
            tasksApi.update(id, updates),
        onSuccess: (updatedTask) => {
            queryClient.setQueryData(['task', taskId], updatedTask);
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsEditing(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => tasksApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            navigate(-1);
        },
    });

    const addSubtaskMutation = useMutation({
        mutationFn: ({ taskId, title }: { taskId: number; title: string }) =>
            tasksApi.createSubtask(taskId, { title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setNewSubtask('');
        },
    });

    const updateSubtaskMutation = useMutation({
        mutationFn: ({ taskId, subtaskId, updates }: { taskId: number; subtaskId: number; updates: { completed?: boolean; title?: string } }) =>
            tasksApi.updateSubtask(taskId, subtaskId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const deleteSubtaskMutation = useMutation({
        mutationFn: ({ taskId, subtaskId }: { taskId: number; subtaskId: number }) =>
            tasksApi.deleteSubtask(taskId, subtaskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const reorderSubtasksMutation = useMutation({
        mutationFn: ({ taskId, subtaskIds }: { taskId: number; subtaskIds: number[] }) =>
            tasksApi.reorderSubtasks(taskId, subtaskIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const handleStatusChange = (status: TaskStatus) => {
        if (!editedTask || !isEditing) return;
        setEditedTask((prev: Task | null) => prev ? { ...prev, status } : null);
    };

    const handlePriorityChange = (priority: TaskPriority) => {
        if (!editedTask || !isEditing) return;
        setEditedTask((prev: Task | null) => prev ? { ...prev, priority } : null);
    };

    const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editedTask || !isEditing) return;
        setEditedTask((prev: Task | null) => prev ? { ...prev, is_personal: e.target.checked } : null);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editedTask) return;
        setEditedTask((prev: Task | null) => prev ? { ...prev, title: e.target.value } : null);
    };

    const handleDescriptionChange = (value: string) => {
        if (!editedTask) return;
        setEditedTask((prev: Task | null) => prev ? { ...prev, description: value } : null);
    };

    const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editedTask) return;
        setEditedTask((prev: Task | null) => prev ? { ...prev, due_date: e.target.value || null } : null);
    };

    const handleStartedAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editedTask) return;
        setEditedTask((prev: Task | null) => prev ? { ...prev, started_at: e.target.value || null } : null);
    };

    const handleCompletedAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editedTask) return;
        setEditedTask((prev: Task | null) => prev ? { ...prev, completed_at: e.target.value || null } : null);
    };

    const datesEqual = (d1: any, d2: any) => {
        if (!d1 && !d2) return true;
        if (!d1 || !d2) return false;
        return new Date(d1).getTime() === new Date(d2).getTime();
    };

    const handleSave = useCallback(() => {
        if (!task || !editedTask) return;
        const updates: Partial<Task> = {};
        if (editedTask.title !== task.title) updates.title = editedTask.title;
        if (editedTask.description !== task.description) updates.description = editedTask.description;
        if (editedTask.status !== task.status) updates.status = editedTask.status;
        if (editedTask.priority !== task.priority) updates.priority = editedTask.priority;
        if (editedTask.is_personal !== task.is_personal) updates.is_personal = editedTask.is_personal;
        if (!datesEqual(editedTask.due_date, task.due_date)) updates.due_date = editedTask.due_date;
        if (!datesEqual(editedTask.started_at, task.started_at)) updates.started_at = editedTask.started_at;
        if (!datesEqual(editedTask.completed_at, task.completed_at)) updates.completed_at = editedTask.completed_at;

        if (Object.keys(updates).length > 0) {
            updateMutation.mutate({ id: task.id, updates });
        } else {
            setIsEditing(false);
        }
    }, [task, editedTask, updateMutation]);

    const handleCancel = () => {
        if (task) {
            setEditedTask(task);
        }
        setIsEditing(false);
    };

    const handleAddSubtask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newSubtask.trim() && taskId) {
            addSubtaskMutation.mutate({ taskId, title: newSubtask.trim() });
        }
    };

    const onDragEnd = (result: any) => {
        if (!result.destination || !taskId) return;
        if (result.destination.index === result.source.index) return;

        const displayTask = editedTask || task;
        if (!displayTask || !displayTask.subtasks) return;

        const items = Array.from(displayTask.subtasks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update local state immediately for responsiveness
        const newSubtasks = items;
        setEditedTask(prev => prev ? { ...prev, subtasks: newSubtasks } : null);

        const subtaskIds = newSubtasks.map((item: Subtask) => item.id);
        reorderSubtasksMutation.mutate({ taskId, subtaskIds });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-text-muted mb-4">Task not found</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue-hover transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const displayTask = isEditing && editedTask ? editedTask : task;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 bg-background-card border-b border-border px-8 py-4 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-background-hover rounded-lg transition-colors group"
                        title="Go Back (Esc)"
                    >
                        <X size={20} className="text-text-muted group-hover:text-text-primary" />
                    </button>
                    <h1 className="text-lg font-semibold text-text-primary">Task Details</h1>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <div className="flex items-center gap-2 mr-2">
                                <label className="text-sm text-text-muted cursor-pointer select-none" htmlFor="popout-personal-check">Personal</label>
                                <input
                                    id="popout-personal-check"
                                    type="checkbox"
                                    checked={displayTask.is_personal}
                                    onChange={handlePersonalChange}
                                    className="w-4 h-4 rounded border-border text-accent-blue focus:ring-accent-blue cursor-pointer"
                                />
                            </div>
                            <button
                                onClick={handleCancel}
                                className="px-3 py-1.5 text-sm text-text-muted hover:bg-background-hover rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                                className="px-3 py-1.5 text-sm bg-accent-blue hover:bg-accent-blue-hover text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                                <Save size={14} />
                                Save
                            </button>
                        </>
                    ) : (
                        <>
                            {task.is_personal && (
                                <span className="text-xs font-medium text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full mr-2">Personal</span>
                            )}
                            <button
                                onClick={() => {
                                    setEditedTask(task);
                                    setIsEditing(true);
                                }}
                                className="p-2 hover:bg-background-hover rounded-lg transition-colors text-text-muted hover:text-accent-blue"
                                title="Edit Task"
                            >
                                <Edit2 size={18} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 hover:bg-accent-red/10 rounded-lg transition-colors text-text-muted hover:text-accent-red"
                        title="Delete Task"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </header>

            {/* Content Content - Two Columns */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto">
                {/* Left Column: Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title */}
                    <div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={displayTask.title}
                                onChange={handleTitleChange}
                                className="w-full text-3xl font-bold text-text-primary bg-transparent border-b-2 border-border focus:border-accent-blue focus:outline-none pb-2 placeholder:text-text-muted/30"
                                placeholder="Task title"
                            />
                        ) : (
                            <h2 className="text-3xl font-bold text-text-primary">{displayTask.title}</h2>
                        )}
                    </div>

                    {/* Status & Priority Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-background-card rounded-xl p-4 border border-border">
                            <label className="block text-sm font-medium text-text-muted mb-3">Status</label>
                            <div className="flex gap-2">
                                {statusOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = displayTask.status?.toLowerCase() === option.value.toLowerCase();
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => handleStatusChange(option.value)}
                                            disabled={!isEditing}
                                            className={`flex-1 flex flex-col items-center justify-center gap-2 px-2 py-3 rounded-lg transition-all ${isSelected ? 'bg-accent-blue/10 border border-accent-blue shadow-sm' : 'bg-background hover:bg-background-hover border border-border'} ${!isEditing && !isSelected ? 'opacity-30' : ''}`}
                                            title={option.label}
                                        >
                                            <Icon size={20} className={isSelected ? option.color : 'text-text-muted'} strokeWidth={isSelected ? 2.5 : 2} />
                                            <span className={`text-xs font-medium ${isSelected ? 'text-text-primary' : 'text-text-muted'}`}>
                                                {option.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-background-card rounded-xl p-4 border border-border">
                            <label className="block text-sm font-medium text-text-muted mb-3">Priority</label>
                            <div className="flex gap-2">
                                {priorityOptions.map((option) => {
                                    const isSelected = (displayTask.priority || 'medium').toLowerCase() === option.value.toLowerCase();
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => handlePriorityChange(option.value)}
                                            disabled={!isEditing}
                                            className={`flex-1 flex flex-col items-center justify-center gap-2 px-2 py-3 rounded-lg transition-all ${isSelected ? 'bg-accent-blue/10 border border-accent-blue shadow-sm' : 'bg-background hover:bg-background-hover border border-border'} ${!isEditing && !isSelected ? 'opacity-30' : ''}`}
                                            title={option.label}
                                        >
                                            <option.icon size={20} className={`${isSelected ? option.color : 'text-text-muted'} ${option.className || ''}`} fill={isSelected ? 'currentColor' : 'none'} />
                                            <span className={`text-xs font-medium ${isSelected ? 'text-text-primary' : 'text-text-muted'}`}>
                                                {option.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-background-card rounded-xl p-4 border border-border group/field hover:border-accent-blue/30 transition-colors">
                            <label className="block text-sm font-medium text-text-muted mb-3 flex items-center gap-2 group-hover/field:text-accent-blue transition-colors">
                                <Calendar size={14} className="text-accent-blue" /> Due Date
                            </label>
                            <div className="text-text-primary font-medium text-sm pl-1 relative">
                                {isEditing ? (
                                    <div className="relative min-h-[1.5rem] flex items-center cursor-pointer" onClick={() => dueDateRef.current?.showPicker()}>
                                        <span className="text-text-primary pointer-events-none">
                                            {displayTask.due_date ? format(new Date(displayTask.due_date), 'MMM d, yyyy') : 'Set due date'}
                                        </span>
                                        <input
                                            ref={dueDateRef}
                                            type="datetime-local"
                                            value={displayTask.due_date ? new Date(displayTask.due_date).toISOString().slice(0, 16) : ''}
                                            onChange={handleDueDateChange}
                                            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                                        />
                                    </div>
                                ) : (
                                    <div>{displayTask.due_date ? format(new Date(displayTask.due_date), 'MMM d, yyyy') : 'Not set'}</div>
                                )}
                            </div>
                        </div>
                        <div className="bg-background-card rounded-xl p-4 border border-border group/field hover:border-accent-amber/30 transition-colors">
                            <label className="block text-sm font-medium text-text-muted mb-3 flex items-center gap-2 group-hover/field:text-accent-amber transition-colors">
                                <Clock size={14} className="text-accent-amber" /> Started
                            </label>
                            <div className="text-text-primary font-medium text-sm pl-1 relative">
                                {isEditing ? (
                                    <div className="relative min-h-[1.5rem] flex items-center cursor-pointer" onClick={() => startedAtRef.current?.showPicker()}>
                                        <span className="text-text-primary pointer-events-none">
                                            {displayTask.started_at ? format(new Date(displayTask.started_at), 'MMM d, yyyy') : 'Not started'}
                                        </span>
                                        <input
                                            ref={startedAtRef}
                                            type="datetime-local"
                                            value={displayTask.started_at ? new Date(displayTask.started_at).toISOString().slice(0, 16) : ''}
                                            onChange={handleStartedAtChange}
                                            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                                        />
                                    </div>
                                ) : (
                                    <div>{displayTask.started_at ? format(new Date(displayTask.started_at), 'MMM d, yyyy') : 'Not started'}</div>
                                )}
                            </div>
                        </div>
                        <div className="bg-background-card rounded-xl p-4 border border-border group/field hover:border-accent-green/30 transition-colors">
                            <label className="block text-sm font-medium text-text-muted mb-3 flex items-center gap-2 group-hover/field:text-accent-green transition-colors">
                                <Check size={14} className="text-accent-green" /> Completed
                            </label>
                            <div className="text-text-primary font-medium text-sm pl-1 relative">
                                {isEditing ? (
                                    <div className="relative min-h-[1.5rem] flex items-center cursor-pointer" onClick={() => completedAtRef.current?.showPicker()}>
                                        <span className="text-text-primary pointer-events-none">
                                            {displayTask.completed_at ? format(new Date(displayTask.completed_at), 'MMM d, yyyy') : 'Not completed'}
                                        </span>
                                        <input
                                            ref={completedAtRef}
                                            type="datetime-local"
                                            value={displayTask.completed_at ? new Date(displayTask.completed_at).toISOString().slice(0, 16) : ''}
                                            onChange={handleCompletedAtChange}
                                            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                                        />
                                    </div>
                                ) : (
                                    <div>{displayTask.completed_at ? format(new Date(displayTask.completed_at), 'MMM d, yyyy') : 'Not completed'}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-background-card rounded-xl p-4 border border-border min-h-[200px]">
                        <label className="block text-sm font-medium text-text-muted mb-3">Description</label>
                        <RichTextEditor
                            content={displayTask.description || ''}
                            onChange={handleDescriptionChange}
                            isEditable={isEditing}
                            placeholder="Add a description..."
                        />
                    </div>

                    {/* Metadata Footer */}
                    <div className="text-xs text-text-muted flex gap-6 pt-4 border-t border-border/50">
                        <p>Created: {format(new Date(task.created_at), 'MMM d, yyyy, h:mm a')}</p>
                        <p>Updated: {format(new Date(task.updated_at), 'MMM d, yyyy, h:mm a')}</p>
                    </div>
                </div>

                {/* Right Column: Subtasks */}
                <div className="lg:col-span-1">
                    <div className="bg-background-card rounded-xl p-5 border border-border sticky top-24 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-text-primary flex items-center gap-2">
                                <ListTodo size={18} className="text-accent-blue" />
                                Subtasks
                            </h3>
                            <span className="text-xs font-mono bg-background-elevated px-2 py-0.5 rounded-full text-text-muted">
                                {displayTask.subtasks?.filter(s => s.completed).length || 0}/{displayTask.subtasks?.length || 0}
                            </span>
                        </div>

                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="subtasks">
                                {(provided: any) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-1 mb-4"
                                    >
                                        {displayTask.subtasks?.map((subtask: Subtask, index: number) => (
                                            <Draggable key={subtask.id} draggableId={subtask.id.toString()} index={index}>
                                                {(provided: any, snapshot: any) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`flex items-start gap-3 group py-2 px-2 hover:bg-background-elevated/50 rounded-lg transition-colors ${snapshot.isDragging ? 'bg-background-elevated shadow-lg border border-accent-blue/30' : ''}`}
                                                    >
                                                        <div {...provided.dragHandleProps} className="mt-1 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary transition-colors">
                                                            <GripVertical size={16} />
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                if (!taskId || !isEditing) return; // Disable toggling while viewing
                                                                const newCompleted = !subtask.completed;
                                                                updateSubtaskMutation.mutate({
                                                                    taskId,
                                                                    subtaskId: subtask.id,
                                                                    updates: { completed: newCompleted }
                                                                });
                                                                // Optimistic update
                                                                setEditedTask((prev: Task | null) => prev ? {
                                                                    ...prev,
                                                                    subtasks: prev.subtasks?.map(s => s.id === subtask.id ? { ...s, completed: newCompleted } : s)
                                                                } : null);
                                                            }}
                                                            disabled={!isEditing}
                                                            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${subtask.completed ? 'bg-accent-green border-accent-green' : 'border-border'} ${isEditing ? 'hover:border-text-muted cursor-pointer' : 'cursor-default opacity-80'}`}
                                                        >
                                                            {subtask.completed && (
                                                                <Check size={12} className="text-white" strokeWidth={3} />
                                                            )}
                                                        </button>
                                                        {isEditing ? (
                                                            <textarea
                                                                defaultValue={subtask.title}
                                                                onBlur={(e) => {
                                                                    if (e.target.value !== subtask.title && taskId) {
                                                                        updateSubtaskMutation.mutate({
                                                                            taskId,
                                                                            subtaskId: subtask.id,
                                                                            updates: { title: e.target.value }
                                                                        });
                                                                    }
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey && taskId) {
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
                                                            <span className={`flex-1 text-sm leading-relaxed ${subtask.completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                                                                {subtask.title}
                                                            </span>
                                                        )}
                                                        {isEditing && (
                                                            <button
                                                                onClick={() => taskId && deleteSubtaskMutation.mutate({ taskId, subtaskId: subtask.id })}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent-red/10 text-text-muted hover:text-accent-red rounded transition-all shrink-0"
                                                                title="Delete Subtask"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        {(!displayTask.subtasks || displayTask.subtasks.length === 0) && (
                                            <div className="text-center py-8 text-text-muted text-sm italic border-2 border-dashed border-border/50 rounded-lg">
                                                No subtasks yet
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>

                        {/* Add subtask input */}
                        {isEditing && (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newSubtask}
                                    onChange={(e) => setNewSubtask(e.target.value)}
                                    onKeyDown={handleAddSubtask}
                                    placeholder="Add a subtask..."
                                    className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all"
                                />
                                <Plus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                {newSubtask && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <span className="text-[10px] bg-background-elevated px-1.5 py-0.5 rounded text-text-muted border border-border">Enter</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => deleteMutation.mutate(task.id)}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
            />
        </div>
    );
}
