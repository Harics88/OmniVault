import { ListFilter, Plus } from 'lucide-react';
import type { Task, TaskStatus } from '../types';
import TaskRow from './TaskRow';

interface TaskListViewProps {
    tasks: Task[];
    activeTasks?: Task[];
    recentHistory?: Task[];
    onTaskClick: (task: Task) => void;
    onStatusChange: (taskId: number, status: TaskStatus) => void;
    onDelete: (taskId: number) => void;
    onEditClick: (task: Task) => void;
    onCreateTask?: () => void;
    selectedTaskIds?: Set<number>;
    onSelectTask?: (taskId: number) => void;
}

export default function TaskListView({
    tasks,
    activeTasks,
    recentHistory,
    onTaskClick,
    onStatusChange,
    onDelete,
    onEditClick,
    onCreateTask,
    selectedTaskIds = new Set(),
    onSelectTask,
}: TaskListViewProps) {
    // If partitioned tasks are provided, use them. Otherwise, fallback to flat 'tasks' prop for backward compatibility.
    const hasPartitionedData = activeTasks !== undefined || recentHistory !== undefined;
    const active = activeTasks || (!hasPartitionedData ? tasks.filter(t => (t.status || '').toLowerCase() !== 'done') : []);
    const history = recentHistory || (!hasPartitionedData ? tasks.filter(t => (t.status || '').toLowerCase() === 'done') : []);

    const TaskHeader = () => (
        <div className="flex items-center gap-2 px-4 py-3 bg-background-elevated/50 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wider">
            <div className="flex-1 min-w-[400px] max-w-[400px] flex-shrink-0">Task Name</div>
            <div className="w-32 flex-shrink-0">Due Date</div>
            <div className="w-32 flex-shrink-0">Started</div>
            <div className="w-32 flex-shrink-0">Completed</div>
            <div className="w-28 flex-shrink-0">Status</div>
            <div className="w-20 flex-shrink-0 text-center">Priority</div>
            <div className="w-24 flex-shrink-0">Progress</div>
            <div className="w-16 flex-shrink-0"></div>
        </div>
    );

    const SectionHeader = ({ title, count }: { title: string, count: number }) => (
        <div className="px-4 py-2 bg-background-elevated/30 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">{title}</h3>
            <span className="text-[10px] bg-background-elevated px-2 py-0.5 rounded-full text-text-muted">{count}</span>
        </div>
    );

    return (
        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
            <TaskHeader />

            <div className="divide-y divide-border">
                {/* Active Tasks Section */}
                {active.length > 0 && (
                    <>
                        <SectionHeader title="Active Tasks" count={active.length} />
                        {active.map((task) => (
                            <TaskRow
                                key={task.id}
                                task={task}
                                onClick={onTaskClick}
                                onStatusChange={onStatusChange}
                                onDelete={onDelete}
                                onEditClick={onEditClick}
                                isSelected={selectedTaskIds.has(task.id)}
                                onSelect={onSelectTask}
                            />
                        ))}
                    </>
                )}

                {/* Recent History Section */}
                {history.length > 0 && (
                    <>
                        <SectionHeader title="Recent History" count={history.length} />
                        {history.map((task) => (
                            <TaskRow
                                key={task.id}
                                task={task}
                                onClick={onTaskClick}
                                onStatusChange={onStatusChange}
                                onDelete={onDelete}
                                onEditClick={onEditClick}
                                isMuted={true}
                                isSelected={selectedTaskIds.has(task.id)}
                                onSelect={onSelectTask}
                            />
                        ))}
                    </>
                )}

                {active.length === 0 && history.length === 0 && (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-background-elevated rounded-full flex items-center justify-center mx-auto mb-4 border border-border/50">
                            <ListFilter size={32} className="text-text-muted opacity-30" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary mb-1">Create your first task to get started</h3>
                        <p className="text-sm text-text-muted mb-6">Stay organized and track your progress effortlessly.</p>
                        {onCreateTask && (
                            <button
                                onClick={onCreateTask}
                                className="btn btn-primary px-6"
                            >
                                <Plus size={18} />
                                Create Task
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
