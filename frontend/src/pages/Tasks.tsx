import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckSquare, Loader2, Circle, Clock, Check, Search, LayoutGrid, List, Table2 } from 'lucide-react';
import { tasksApi } from '../lib/api';
import TaskCard from '../components/TaskCard';
import TaskPanel from '../components/TaskPanel';
import TaskListView from '../components/TaskListView';
import TaskTableView from '../components/TaskTableView';
import type { Task, TaskStatus, CreateTask, UpdateTask, Subtask } from '../types';
import { subDays } from 'date-fns';

interface StatusGroup {
    status: TaskStatus;
    label: string;
    icon: typeof Circle;
    color: string;
    bgColor: string;
    borderColor: string;
}

const statusGroups: StatusGroup[] = [
    {
        status: 'not_started',
        label: 'Not Started',
        icon: Circle,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-500/50'
    },
    {
        status: 'in_progress',
        label: 'In Progress',
        icon: Clock,
        color: 'text-accent-amber',
        bgColor: 'bg-accent-amber/20',
        borderColor: 'border-accent-amber/50'
    },
    {
        status: 'done',
        label: 'Done',
        icon: Check,
        color: 'text-accent-green',
        bgColor: 'bg-accent-green/20',
        borderColor: 'border-accent-green/50'
    },
];

export default function Tasks() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [panelWidth, setPanelWidth] = useState(420);
    const [viewMode, setViewMode] = useState<'list' | 'board' | 'table'>(() => {
        return (localStorage.getItem('taskViewMode') as 'list' | 'board' | 'table') || 'list';
    });
    const [showArchived, setShowArchived] = useState(false);
    const [openInEditMode, setOpenInEditMode] = useState(false);

    useEffect(() => {
        localStorage.setItem('taskViewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks', searchQuery],
        queryFn: () => tasksApi.getAll(undefined, searchQuery || undefined),
    });

    const createMutation = useMutation({
        mutationFn: (task: CreateTask) => tasksApi.create(task),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['system'] });
            setNewTaskTitle('');
            setIsCreating(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: number; updates: UpdateTask }) =>
            tasksApi.update(id, updates),
        onSuccess: (updatedTask: Task) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (selectedTask?.id === updatedTask.id) {
                setSelectedTask(updatedTask);
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => tasksApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['system'] });
            setSelectedTask(null);
        },
    });

    // Subtask Mutations
    const addSubtaskMutation = useMutation({
        mutationFn: ({ taskId, title }: { taskId: number; title: string }) =>
            tasksApi.createSubtask(taskId, { title }),
        onSuccess: (data: Subtask, variables: { taskId: number }) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
            // Update selected task if it's the one being modified
            if (selectedTask?.id === variables.taskId) {
                setSelectedTask({
                    ...selectedTask,
                    subtasks: [...(selectedTask.subtasks || []), data]
                });
            }
        }
    });

    const updateSubtaskMutation = useMutation({
        mutationFn: ({ taskId, subtaskId, updates }: { taskId: number; subtaskId: number; updates: { completed?: boolean; title?: string } }) =>
            tasksApi.updateSubtask(taskId, subtaskId, updates),
        onSuccess: (data: Subtask, variables: { taskId: number; subtaskId: number; updates: { completed?: boolean; title?: string } }) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
            // Update selected task if it's the one being modified to reflect changes immediately in panel
            if (selectedTask?.id === variables.taskId) {
                const updatedSubtasks = selectedTask.subtasks?.map((st: Subtask) =>
                    st.id === variables.subtaskId ? { ...st, ...data } : st
                );
                setSelectedTask({ ...selectedTask, subtasks: updatedSubtasks });
            }
        }
    });

    const deleteSubtaskMutation = useMutation({
        mutationFn: ({ taskId, subtaskId }: { taskId: number; subtaskId: number }) =>
            tasksApi.deleteSubtask(taskId, subtaskId),
        onSuccess: (_data: any, variables: { taskId: number; subtaskId: number }) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
            // Update selected task if it's the one being modified
            if (selectedTask?.id === variables.taskId) {
                setSelectedTask({
                    ...selectedTask,
                    subtasks: selectedTask.subtasks?.filter(s => s.id !== variables.subtaskId) || []
                });
            }
        }
    });

    const reorderSubtasksMutation = useMutation({
        mutationFn: ({ taskId, subtaskIds }: { taskId: number; subtaskIds: number[] }) =>
            tasksApi.reorderSubtasks(taskId, subtaskIds),
        onSuccess: (_data: any, variables: { taskId: number; subtaskIds: number[] }) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] }); // Added for sync with Full View
            if (selectedTask?.id === variables.taskId) {
                const subtasksMap = new Map((selectedTask.subtasks || []).map((s: Subtask) => [s.id, s]));
                const newSubtasks = variables.subtaskIds.map((id: number) => subtasksMap.get(id)).filter(Boolean) as Subtask[];
                setSelectedTask({ ...selectedTask, subtasks: newSubtasks });
            }
        }
    });

    const handleCreateTask = () => {
        if (!newTaskTitle.trim()) return;
        createMutation.mutate({ title: newTaskTitle.trim() });
    };

    const handleStatusChange = (taskId: number, status: TaskStatus) => {
        updateMutation.mutate({ id: taskId, updates: { status } });
    };

    const onUpdateTask = (taskId: number, updates: Partial<Task>) => {
        updateMutation.mutate({ id: taskId, updates });
    };
    const onDeleteTask = (task: Task) => {
        deleteMutation.mutate(task.id);
    };

    const handleTaskClick = (task: Task) => {
        // Open in full screen (popout view)
        navigate(`/tasks/${task.id}`);
    };

    const handleEditClick = (task: Task) => {
        // Open side panel in edit mode
        setOpenInEditMode(true);
        setSelectedTask(task);
    };

    // Partition Logic (Case Insensitive)
    const partitions = useMemo(() => {
        const threshold = subDays(new Date(), 14);
        const overdueTasks = tasks.filter((t: Task) => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date());
        const upcomingTasks = tasks.filter((t: Task) => t.status !== 'done' && t.due_date && new Date(t.due_date) >= new Date());
        const active = tasks.filter((t: Task) => (t.status || '').toLowerCase() !== 'done');
        const recentHistory = tasks.filter((t: Task) =>
            (t.status || '').toLowerCase() === 'done' &&
            t.completed_at &&
            new Date(t.completed_at) >= threshold
        );
        return { active, recentHistory };
    }, [tasks]);

    // Grouping for Board View (Case Insensitive)
    const boardGroups = useMemo(() => {
        const threshold = subDays(new Date(), 14);
        return statusGroups.map(group => {
            let filtered = tasks.filter(task => (task.status || '').toLowerCase() === group.status.toLowerCase());
            if (group.status.toLowerCase() === 'done') {
                filtered = filtered.filter(task =>
                    task.completed_at && new Date(task.completed_at) >= threshold
                );
            }
            return { ...group, tasks: filtered };
        });
    }, [tasks]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-fade-in bg-background overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background border-b border-border px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                            <CheckSquare size={24} className="text-accent-blue" />
                            Tasks
                            <span className="text-[10px] text-text-muted opacity-0" id="version-tag">v2-partitioned</span>
                        </h1>

                        <div className="flex items-center gap-1 bg-background-card p-1 rounded-lg border border-border ml-6">
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-background-hover'}`} title="List View"><List size={18} /></button>
                            <button onClick={() => setViewMode('board')} className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-background-hover'}`} title="Board View"><LayoutGrid size={18} /></button>
                            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-background-hover'}`} title="All Tasks (Table View)"><Table2 size={18} /></button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search tasks..."
                                className="input pl-9 h-9 text-sm w-full"
                            />
                        </div>
                        {viewMode === 'table' && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-background-card border border-border rounded-lg text-xs font-medium text-text-muted">
                                <span>Archived</span>
                                <input
                                    type="checkbox"
                                    checked={showArchived}
                                    onChange={(e) => setShowArchived(e.target.checked)}
                                    className="w-4 h-4 rounded border-border text-accent-blue focus:ring-accent-blue cursor-pointer"
                                />
                            </div>
                        )}
                        <button onClick={() => setIsCreating(true)} className="btn btn-primary"><Plus size={18} />New Task</button>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <div
                    className="max-w-7xl h-full transition-all duration-300 mx-auto flex flex-col p-6"
                    style={{ marginRight: selectedTask ? `${panelWidth}px` : 'auto' }}
                >
                    {/* Quick Add */}
                    {isCreating && (
                        <div className="card p-4 mb-6 animate-slide-up bg-background-card border border-border shrink-0">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateTask();
                                        if (e.key === 'Escape') { setIsCreating(false); setNewTaskTitle(''); }
                                    }}
                                    placeholder="What needs to be done?"
                                    className="input flex-1"
                                    autoFocus
                                />
                                <button onClick={handleCreateTask} disabled={!newTaskTitle.trim() || createMutation.isPending} className="btn btn-primary">{createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Add'}</button>
                                <button onClick={() => { setIsCreating(false); setNewTaskTitle(''); }} className="btn btn-ghost">Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* View Switcher Content */}
                    <div className="flex-1 overflow-hidden min-h-0">
                        {viewMode === 'list' && (
                            <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                                <TaskListView
                                    tasks={[]}
                                    activeTasks={partitions.active}
                                    recentHistory={partitions.recentHistory}
                                    onTaskClick={handleTaskClick}
                                    onStatusChange={handleStatusChange}
                                    onDelete={(id) => deleteMutation.mutate(id)}
                                    onEditClick={handleEditClick}
                                    onCreateTask={() => setIsCreating(true)}
                                />
                            </div>
                        )}

                        {viewMode === 'board' && (
                            <div className="flex gap-6 h-full min-h-0">
                                {boardGroups.map((group) => {
                                    const Icon = group.icon;
                                    const isDone = group.status.toLowerCase() === 'done';

                                    return (
                                        <div key={group.status} className="flex-1 flex flex-col min-w-[320px] rounded-xl overflow-hidden border border-border bg-background-card/50">
                                            {/* Column Header */}
                                            <div className={`flex items-center gap-3 px-4 py-3 ${group.bgColor} border-b ${group.borderColor} shrink-0`}>
                                                <div className={`w-8 h-8 rounded-lg ${group.bgColor} flex items-center justify-center border ${group.borderColor}`}>
                                                    <Icon size={16} className={group.color} strokeWidth={isDone ? 3 : 2} />
                                                </div>
                                                <span className={`font-bold ${group.color} uppercase tracking-widest text-xs`}>{group.label}</span>
                                                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${group.bgColor} ${group.color} border ${group.borderColor}`}>
                                                    {group.tasks.length}
                                                </span>
                                            </div>

                                            {/* Task Scroll Area */}
                                            <div className={`flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar ${isDone ? 'bg-background-elevated/10' : ''}`}>
                                                {group.tasks.map((task) => (
                                                    <TaskCard
                                                        key={task.id}
                                                        task={task}
                                                        onClick={handleTaskClick}
                                                        onStatusChange={handleStatusChange}
                                                        isCompact={true}
                                                        disableStatusClick={true}
                                                    />
                                                ))}
                                                {group.tasks.length === 0 && (
                                                    <div className="h-32 flex items-center justify-center text-text-muted text-xs italic border-2 border-dashed border-border/50 rounded-lg">
                                                        Empty
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {viewMode === 'table' && (
                            <div className="h-full overflow-hidden">
                                <TaskTableView
                                    tasks={tasks}
                                    searchQuery={searchQuery}
                                    showArchived={showArchived}
                                    onTaskClick={handleTaskClick}
                                    onStatusChange={handleStatusChange}
                                    onDelete={(id) => deleteMutation.mutate(id)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Task Detail Panel Overlay */}
                {selectedTask && (
                    <TaskPanel
                        task={selectedTask}
                        width={panelWidth}
                        initialEditMode={openInEditMode}
                        onWidthChange={setPanelWidth}
                        onClose={() => {
                            setSelectedTask(null);
                            setOpenInEditMode(false);
                        }}
                        onUpdate={onUpdateTask}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        onAddSubtask={(taskId, title) => addSubtaskMutation.mutate({ taskId, title })}
                        onUpdateSubtask={(taskId, subtaskId, updates) => updateSubtaskMutation.mutate({ taskId, subtaskId, updates })}
                        onDeleteSubtask={(taskId, subtaskId) => deleteSubtaskMutation.mutate({ taskId, subtaskId })}
                        onReorderSubtasks={(taskId, subtaskIds) => reorderSubtasksMutation.mutate({ taskId, subtaskIds })}
                    />
                )}
            </div>
        </div>
    );
}
