import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, CheckSquare, Loader2, ChevronDown, ChevronRight, Circle, Clock, Check } from 'lucide-react';
import { tasksApi } from '../lib/api';
import TaskCard from '../components/TaskCard';
import TaskPanel from '../components/TaskPanel';
import type { Task, TaskStatus, CreateTask, UpdateTask } from '../types';

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

interface CollapsedState {
    not_started: boolean;
    in_progress: boolean;
    done: boolean;
}

export default function Tasks() {
    const queryClient = useQueryClient();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [collapsed, setCollapsed] = useState<CollapsedState>({
        not_started: false,
        in_progress: false,
        done: true,  // Collapsed by default
    });
    const [panelWidth, setPanelWidth] = useState(420);

    // Fetch all tasks (no filter)
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => tasksApi.getAll(),
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['tasks', 'stats'],
        queryFn: tasksApi.getStats,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (task: CreateTask) => tasksApi.create(task),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setNewTaskTitle('');
            setIsCreating(false);
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: number; updates: UpdateTask }) =>
            tasksApi.update(id, updates),
        onSuccess: (updatedTask) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (selectedTask?.id === updatedTask.id) {
                setSelectedTask(updatedTask);
            }
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => tasksApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setSelectedTask(null);
        },
    });

    // Subtask mutations
    const addSubtaskMutation = useMutation({
        mutationFn: ({ taskId, title }: { taskId: number; title: string }) =>
            tasksApi.createSubtask(taskId, { title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (selectedTask) {
                tasksApi.getById(selectedTask.id).then(setSelectedTask);
            }
        },
    });

    const updateSubtaskMutation = useMutation({
        mutationFn: ({ taskId, subtaskId, updates }: { taskId: number; subtaskId: number; updates: { completed?: boolean; title?: string } }) =>
            tasksApi.updateSubtask(taskId, subtaskId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (selectedTask) {
                tasksApi.getById(selectedTask.id).then(setSelectedTask);
            }
        },
    });

    const deleteSubtaskMutation = useMutation({
        mutationFn: ({ taskId, subtaskId }: { taskId: number; subtaskId: number }) =>
            tasksApi.deleteSubtask(taskId, subtaskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (selectedTask) {
                tasksApi.getById(selectedTask.id).then(setSelectedTask);
            }
        },
    });

    const handleCreateTask = () => {
        if (!newTaskTitle.trim()) return;
        createMutation.mutate({ title: newTaskTitle.trim() });
    };

    const handleStatusChange = (taskId: number, status: TaskStatus) => {
        updateMutation.mutate({ id: taskId, updates: { status } });
    };

    const handleUpdateTask = (taskId: number, updates: Partial<Task>) => {
        updateMutation.mutate({ id: taskId, updates });
    };

    const handleAddSubtask = (taskId: number, title: string) => {
        addSubtaskMutation.mutate({ taskId, title });
    };

    const handleUpdateSubtask = (taskId: number, subtaskId: number, updates: { completed?: boolean; title?: string }) => {
        updateSubtaskMutation.mutate({ taskId, subtaskId, updates });
    };

    const handleDeleteSubtask = (taskId: number, subtaskId: number) => {
        deleteSubtaskMutation.mutate({ taskId, subtaskId });
    };

    const toggleCollapse = (status: TaskStatus) => {
        setCollapsed(prev => ({ ...prev, [status]: !prev[status] }));
    };

    // Group tasks by status
    const groupedTasks = statusGroups.map(group => ({
        ...group,
        tasks: tasks.filter(task => task.status === group.status)
    }));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                            <CheckSquare size={24} className="text-accent-blue" />
                            Tasks
                        </h1>

                        {stats && (
                            <div className="flex items-center gap-2 ml-4">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-background-card border border-border rounded-full shadow-sm" title="Not Started">
                                    <Circle size={14} className="text-text-muted" />
                                    <span className="text-sm font-medium">{stats.by_status.not_started || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-amber/10 border border-accent-amber/20 rounded-full shadow-sm" title="In Progress">
                                    <Clock size={14} className="text-accent-amber" />
                                    <span className="text-sm font-medium text-accent-amber">{stats.by_status.in_progress || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-green/10 border border-accent-green/20 rounded-full shadow-sm" title="Done">
                                    <Check size={14} className="text-accent-green" />
                                    <span className="text-sm font-medium text-accent-green">{stats.by_status.done || 0}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn btn-primary"
                    >
                        <Plus size={18} />
                        New Task
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div
                    className="max-w-4xl transition-all duration-300"
                    style={{ marginRight: selectedTask ? `${panelWidth}px` : '0px' }}
                >
                    {/* Quick Add */}
                    {isCreating && (
                        <div className="card p-4 mb-6 animate-slide-up">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateTask();
                                        if (e.key === 'Escape') {
                                            setIsCreating(false);
                                            setNewTaskTitle('');
                                        }
                                    }}
                                    placeholder="What needs to be done?"
                                    className="input flex-1"
                                    autoFocus
                                />
                                <button
                                    onClick={handleCreateTask}
                                    disabled={!newTaskTitle.trim() || createMutation.isPending}
                                    className="btn btn-primary"
                                >
                                    {createMutation.isPending ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        'Add'
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewTaskTitle('');
                                    }}
                                    className="btn btn-ghost"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Grouped Task List */}
                    {tasks.length > 0 ? (
                        <div className="space-y-4">
                            {groupedTasks.map((group) => {
                                const Icon = group.icon;
                                const isCollapsed = collapsed[group.status];
                                const taskCount = group.tasks.length;

                                return (
                                    <div key={group.status} className="rounded-xl overflow-hidden border border-border">
                                        {/* Group Header */}
                                        <button
                                            onClick={() => toggleCollapse(group.status)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 ${group.bgColor} hover:opacity-90 transition-all`}
                                        >
                                            {/* Collapse Arrow */}
                                            <div className="text-text-muted">
                                                {isCollapsed ? (
                                                    <ChevronRight size={18} />
                                                ) : (
                                                    <ChevronDown size={18} />
                                                )}
                                            </div>

                                            {/* Status Icon */}
                                            <div className={`w-6 h-6 rounded-lg ${group.bgColor} flex items-center justify-center`}>
                                                <Icon size={14} className={group.color} strokeWidth={group.status === 'done' ? 3 : 2} />
                                            </div>

                                            {/* Label */}
                                            <span className={`font-semibold ${group.color}`}>
                                                {group.label}
                                            </span>

                                            {/* Count Badge */}
                                            <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium ${group.bgColor} ${group.color}`}>
                                                {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                                            </span>
                                        </button>

                                        {/* Task List */}
                                        {!isCollapsed && taskCount > 0 && (
                                            <div className="bg-background-card divide-y divide-border">
                                                {group.tasks.map((task) => (
                                                    <div key={task.id} className="px-2 py-1">
                                                        <TaskCard
                                                            task={task}
                                                            onClick={(t) => setSelectedTask(t)}
                                                            onStatusChange={handleStatusChange}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Empty State */}
                                        {!isCollapsed && taskCount === 0 && (
                                            <div className="bg-background-card px-4 py-6 text-center text-text-muted text-sm">
                                                No {group.label.toLowerCase()} tasks
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card p-12 text-center">
                            <CheckSquare size={48} className="mx-auto mb-4 text-text-muted/30" />
                            <h3 className="text-lg font-medium text-text-primary mb-2">No tasks yet</h3>
                            <p className="text-text-muted mb-4">
                                Create your first task to get started
                            </p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="btn btn-primary"
                            >
                                <Plus size={18} />
                                Create Task
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Task Detail Panel */}
            {selectedTask && (
                <TaskPanel
                    task={selectedTask}
                    width={panelWidth}
                    onWidthChange={setPanelWidth}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleUpdateTask}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onAddSubtask={handleAddSubtask}
                    onUpdateSubtask={handleUpdateSubtask}
                    onDeleteSubtask={handleDeleteSubtask}
                />
            )}
        </div>
    );
}
