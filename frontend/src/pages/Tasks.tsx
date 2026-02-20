import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { Plus, CheckSquare, Loader2, Circle, Clock, Check, Search, LayoutGrid, List, Table2, Trash2 } from 'lucide-react';
import { tasksApi } from '../lib/api';
import TaskCard from '../components/TaskCard';
import TaskPanel from '../components/TaskPanel';
import TaskListView from '../components/TaskListView';
import TaskTableView from '../components/TaskTableView';
import type { Task, TaskStatus, CreateTask, UpdateTask, Subtask } from '../types';
import { subDays } from 'date-fns';
import Skeleton from '../components/Skeleton';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { parseServerDate } from '../utils/date';

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
    const location = useLocation();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const { showToast } = useToast();
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
    const [enablePersonal, setEnablePersonal] = useState(() => localStorage.getItem('enablePersonalTasks') === 'true');
    const [personalFilter, setPersonalFilter] = useState<'all' | 'work' | 'personal'>('work');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

    // Re-check settings on storage change (e.g. from Settings tab)
    useEffect(() => {
        const handleStorageChange = () => {
            setEnablePersonal(localStorage.getItem('enablePersonalTasks') === 'true');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        localStorage.setItem('taskViewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('new') === 'true') {
            setIsCreating(true);
            // Clear the param
            navigate('/tasks', { replace: true });
        }
    }, [location.search, navigate]);

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks', searchQuery, enablePersonal, personalFilter],
        queryFn: () => {
            let isPersonal: boolean | undefined = undefined;
            if (enablePersonal) {
                if (personalFilter === 'personal') isPersonal = true;
                if (personalFilter === 'work') isPersonal = false;
            }
            return tasksApi.getAll(undefined, searchQuery || undefined, isPersonal);
        },
        placeholderData: keepPreviousData,
    });


    const createMutation = useMutation({
        mutationFn: (task: CreateTask) => {
            let isPersonal = false;
            if (enablePersonal && personalFilter === 'personal') isPersonal = true;
            return tasksApi.create({ ...task, is_personal: isPersonal });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['system'] });
            setNewTaskTitle('');
            setIsCreating(false);
            showToast('Task created ✓');
        },
    });


    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: number; updates: UpdateTask }) =>
            tasksApi.update(id, updates),
        onMutate: async ({ id, updates }) => {
            // Cancel outgoing refetches to prevent overwrites
            await queryClient.cancelQueries({ queryKey: ['tasks'] });
            await queryClient.cancelQueries({ queryKey: ['task', id] });

            // Snapshot previous values
            const previousTasks = queryClient.getQueryData(['tasks']);
            const previousTask = queryClient.getQueryData(['task', id]);

            // 1. Update the list view cache
            queryClient.setQueryData(['tasks'], (old: any) => {
                if (!old) return [];
                return old.map((t: Task) => t.id === id ? { ...t, ...updates } : t);
            });

            // 2. Update the specific task cache (if open in popout)
            if (previousTask) {
                queryClient.setQueryData(['task', id], (old: any) => ({ ...old, ...updates }));
            }

            // 3. Update local selectedTask state for panel reflection
            if (selectedTask?.id === id) {
                setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
            }

            return { previousTasks, previousTask };
        },
        onError: (_err, { id }, context) => {
            // Rollback on error
            if (context?.previousTasks) queryClient.setQueryData(['tasks'], context.previousTasks);
            if (context?.previousTask) queryClient.setQueryData(['task', id], context.previousTask);
            showToast('Failed to update task');
        },
        onSettled: (_updatedTask, err, { id }) => {
            // Background sync
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', id] });
            if (!err) showToast('Task saved ✓');
        },
    });


    const deleteMutation = useMutation({
        mutationFn: (id: number) => tasksApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['system'] });
            setSelectedTask(null);
            setTaskToDelete(null);
            setDeleteConfirmOpen(false);
            showToast('Task deleted');
        },
    });


    // Subtask Mutations
    const addSubtaskMutation = useMutation({
        mutationFn: ({ taskId, title }: { taskId: number; title: string }) =>
            tasksApi.createSubtask(taskId, { title }),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
            // Update selected task if it's the one being modified
            if (variables.taskId === variables.taskId) {
                setSelectedTask(prev => prev?.id === variables.taskId ? {
                    ...prev,
                    subtasks: [...(prev.subtasks || []), data]
                } : prev);
            }


        }
    });

    const updateSubtaskMutation = useMutation({
        mutationFn: ({ taskId, subtaskId, updates }: { taskId: number; subtaskId: number; updates: { completed?: boolean; title?: string } }) =>
            tasksApi.updateSubtask(taskId, subtaskId, updates),
        onMutate: async ({ taskId, subtaskId, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['task', taskId] });
            const previousTask = queryClient.getQueryData(['task', taskId]);

            if (taskId === taskId) {
                setSelectedTask(prev => {
                    if (prev?.id !== taskId) return prev;
                    const updatedSubtasks = prev.subtasks?.map((st: Subtask) =>
                        st.id === subtaskId ? { ...st, ...updates } : st
                    );
                    return { ...prev, subtasks: updatedSubtasks };
                });
            }


            return { previousTask };
        },
        onError: (_err, { taskId }, context) => {
            if (context?.previousTask) {
                if (selectedTask?.id === taskId) {
                    setSelectedTask(context.previousTask as Task);
                }
            }
            showToast('Failed to update subtask');
        },
        onSettled: (_data, _err, { taskId }) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        }
    });

    const deleteSubtaskMutation = useMutation({
        mutationFn: ({ taskId, subtaskId }: { taskId: number; subtaskId: number }) =>
            tasksApi.deleteSubtask(taskId, subtaskId),
        onSuccess: (_data: any, variables: { taskId: number; subtaskId: number }) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
            // Update selected task if it's the one being modified
            if (variables.taskId === variables.taskId) {
                setSelectedTask(prev => prev?.id === variables.taskId ? {
                    ...prev,
                    subtasks: prev.subtasks?.filter(s => s.id !== variables.subtaskId) || []
                } : prev);
            }


        }
    });

    const reorderSubtasksMutation = useMutation({
        mutationFn: ({ taskId, subtaskIds }: { taskId: number; subtaskIds: number[] }) =>
            tasksApi.reorderSubtasks(taskId, subtaskIds),
        onSuccess: (_data: any, variables: { taskId: number; subtaskIds: number[] }) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] }); // Added for sync with Full View
            if (variables.taskId === variables.taskId) {
                setSelectedTask(prev => {
                    if (prev?.id !== variables.taskId) return prev;
                    const subtasksMap = new Map((prev.subtasks || []).map((s: Subtask) => [s.id, s]));
                    const newSubtasks = variables.subtaskIds.map((id: number) => subtasksMap.get(id)).filter(Boolean) as Subtask[];
                    return { ...prev, subtasks: newSubtasks };
                });
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

    const onUpdateTask = async (id: number, updates: Partial<Task>) => {
        return await updateMutation.mutateAsync({ id, updates });
    };

    const handleTaskClick = (task: Task) => {
        // Open in full screen (popout view)
        navigate(`/tasks/${task.id}`);
    };

    const handleDeleteTask = (id: number) => {
        setTaskToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleEditClick = (task: Task) => {
        // Open side panel in edit mode
        setOpenInEditMode(true);
        setSelectedTask(task);
    };

    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());

    const handleToggleSelectTask = (taskId: number) => {
        setSelectedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    };


    const handleClearSelection = () => {
        setSelectedTaskIds(new Set());
    };

    const bulkUpdateMutation = useMutation({
        mutationFn: (updates: { ids: number[], data: UpdateTask }) =>
            Promise.all(updates.ids.map(id => tasksApi.update(id, updates.data))),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            showToast(`Updated ${selectedTaskIds.size} tasks`);
            handleClearSelection();
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: number[]) => Promise.all(ids.map(id => tasksApi.delete(id))),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            showToast(`Deleted ${selectedTaskIds.size} tasks`);
            handleClearSelection();
        }
    });

    // Column-specific inline add state
    const [inlineAddStatus, setInlineAddStatus] = useState<TaskStatus | null>(null);
    const [inlineAddTitle, setInlineAddTitle] = useState('');

    const handleCreateTaskAtStatus = (status: TaskStatus) => {
        if (!inlineAddTitle.trim()) return;
        createMutation.mutate({
            title: inlineAddTitle.trim(),
            status: status
        }, {
            onSuccess: () => {
                setInlineAddTitle('');
                setInlineAddStatus(null);
            }
        });
    };

    // Partition Logic (Case Insensitive)
    const partitions = useMemo(() => {
        const threshold = subDays(new Date(), 14);
        // overdueTasks and upcomingTasks were calculated but unused in this component (might be used in sub-components if passed, but TaskListView only takes active/recent)
        // Removing them to fix TS6133
        const active = tasks.filter((t: Task) => (t.status || '').toLowerCase() !== 'done');
        const recentHistory = tasks.filter((t: Task) =>
            (t.status || '').toLowerCase() === 'done' &&
            t.completed_at &&
            parseServerDate(t.completed_at) >= threshold
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
                    task.completed_at && parseServerDate(task.completed_at) >= threshold
                );
            }
            return { ...group, tasks: filtered };
        });
    }, [tasks]);

    if (isLoading) {
        return (
            <div className="h-full flex flex-col bg-background overflow-hidden p-6">
                <div className="flex justify-between mb-8">
                    <div className="space-y-2">
                        <Skeleton width={150} height={32} />
                        <Skeleton width={250} height={16} />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton width={200} height={40} />
                        <Skeleton width={120} height={40} />
                    </div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} height={80} variant="rect" className="w-full" />
                    ))}
                </div>
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
                            <span className="text-[10px] text-text-muted opacity-0" id="version-tag">v2.5.0</span>
                        </h1>

                        <div className="flex items-center gap-1 bg-background-card p-1 rounded-lg border border-border ml-6">
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-background-hover'}`} title="List View"><List size={18} /></button>
                            <button onClick={() => setViewMode('board')} className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-background-hover'}`} title="Board View"><LayoutGrid size={18} /></button>
                            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-background-hover'}`} title="All Tasks (Table View)"><Table2 size={18} /></button>
                        </div>

                        {enablePersonal && (
                            <div className="flex items-center gap-1 bg-background-card p-1 rounded-lg border border-border ml-4">
                                <button
                                    onClick={() => setPersonalFilter('work')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${personalFilter === 'work' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-background-hover'}`}
                                >
                                    Work
                                </button>
                                <button
                                    onClick={() => setPersonalFilter('personal')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${personalFilter === 'personal' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-background-hover'}`}
                                >
                                    Personal
                                </button>
                                <button
                                    onClick={() => setPersonalFilter('all')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${personalFilter === 'all' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-background-hover'}`}
                                >
                                    All
                                </button>
                            </div>
                        )}
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
                                    onDelete={handleDeleteTask}
                                    onEditClick={handleEditClick}
                                    onCreateTask={() => setIsCreating(true)}
                                    selectedTaskIds={selectedTaskIds}
                                    onSelectTask={handleToggleSelectTask}
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
                                                        isSelected={selectedTaskIds.has(task.id)}
                                                        onSelect={handleToggleSelectTask}
                                                    />
                                                ))}
                                                {group.tasks.length === 0 && (
                                                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                                        <div className="w-12 h-12 bg-background-elevated rounded-full flex items-center justify-center mb-3 opacity-20 border border-border">
                                                            <Icon size={20} className={group.color} />
                                                        </div>
                                                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">No {group.label} tasks</p>
                                                        <p className="text-[10px] text-text-muted/60 max-w-[150px]">Items in this stage will appear here.</p>
                                                    </div>
                                                )}

                                                {/* Inline Add */}
                                                {inlineAddStatus === group.status ? (
                                                    <div className="animate-slide-up bg-background-card border border-accent-blue/30 rounded-lg p-2 shadow-sm">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={inlineAddTitle}
                                                            onChange={(e) => setInlineAddTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleCreateTaskAtStatus(group.status);
                                                                if (e.key === 'Escape') { setInlineAddStatus(null); setInlineAddTitle(''); }
                                                            }}
                                                            placeholder="Task title..."
                                                            className="w-full bg-transparent border-none focus:outline-none text-sm p-1 placeholder:text-text-muted"
                                                        />
                                                        <div className="flex items-center justify-end gap-1 mt-2">
                                                            <button
                                                                onClick={() => { setInlineAddStatus(null); setInlineAddTitle(''); }}
                                                                className="p-1 text-[10px] font-bold text-text-muted hover:text-text-primary uppercase tracking-wider"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => handleCreateTaskAtStatus(group.status)}
                                                                disabled={!inlineAddTitle.trim() || createMutation.isPending}
                                                                className="px-2 py-1 bg-accent-blue text-white rounded text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                                                            >
                                                                Add
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setInlineAddStatus(group.status)}
                                                        className="w-full py-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-border text-text-muted hover:text-text-primary hover:border-border-hover hover:bg-background-hover transition-all group/add"
                                                    >
                                                        <Plus size={14} className="group-hover/add:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Add Task</span>
                                                    </button>
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
                                    onDelete={handleDeleteTask}
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
                        onDelete={handleDeleteTask}
                        onAddSubtask={(taskId, title) => addSubtaskMutation.mutateAsync({ taskId, title })}
                        onUpdateSubtask={(taskId, subtaskId, updates) => updateSubtaskMutation.mutateAsync({ taskId, subtaskId, updates })}
                        onDeleteSubtask={(taskId, subtaskId) => deleteSubtaskMutation.mutateAsync({ taskId, subtaskId })}
                        onReorderSubtasks={(taskId, subtaskIds) => reorderSubtasksMutation.mutateAsync({ taskId, subtaskIds })}
                    />
                )}

                {/* Bulk Action Toolbar */}
                {selectedTaskIds.size > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
                        <div className="bg-background-card border border-border shadow-elevated rounded-2xl px-6 py-3 flex items-center gap-6 backdrop-blur-md">
                            <div className="flex items-center gap-3 pr-6 border-r border-border">
                                <span className="w-6 h-6 rounded-full bg-accent-blue text-white text-[10px] font-bold flex items-center justify-center">
                                    {selectedTaskIds.size}
                                </span>
                                <span className="text-sm font-medium text-text-primary">Tasks Selected</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedTaskIds), data: { status: 'done' as any } })}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-accent-green hover:bg-accent-green/10 rounded-lg transition-colors"
                                >
                                    <Check size={14} />
                                    Mark Done
                                </button>
                                <button
                                    onClick={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedTaskIds), data: { status: 'in_progress' as any } })}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-accent-amber hover:bg-accent-amber/10 rounded-lg transition-colors"
                                >
                                    <Clock size={14} />
                                    In Progress
                                </button>
                                <button
                                    onClick={() => bulkDeleteMutation.mutate(Array.from(selectedTaskIds))}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={14} className="Lucide" />
                                    Delete
                                </button>
                            </div>

                            <div className="pl-6 border-l border-border">
                                <button
                                    onClick={handleClearSelection}
                                    className="text-xs font-bold text-text-muted hover:text-text-primary uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={deleteConfirmOpen}
                    onClose={() => setDeleteConfirmOpen(false)}
                    onConfirm={() => taskToDelete && deleteMutation.mutate(taskToDelete)}
                    title="Delete Task"
                    message="Are you sure you want to delete this task? This action will remove all subtasks and cannot be undone."
                    confirmText="Delete Task"
                />
            </div>
        </div>
    );
}
