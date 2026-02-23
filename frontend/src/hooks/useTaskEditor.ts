import { useState, useCallback, useRef } from 'react';
import type { Task, TaskStatus, TaskPriority } from '../types';

/**
 * Configuration options for the useTaskEditor hook
 */
export interface UseTaskEditorOptions {
    /** The original task data from props or API */
    task: Task;
    /** Callback triggered when save is invoked with changes */
    onSave: (taskId: number, updates: Partial<Task>) => void | Promise<void>;
    /** Whether to start in editing mode (default: false) */
    initialEditMode?: boolean;
}

/**
 * Return type for the useTaskEditor hook
 */
export interface UseTaskEditorReturn {
    /** The current edited version of the task */
    editedTask: Task;
    /** Whether the editor is currently in edit mode */
    isEditing: boolean;
    /** Whether a save operation is in progress */
    isSaving: boolean;
    /** Refs for date picker inputs */
    dueDateRef: React.RefObject<HTMLInputElement>;
    startedAtRef: React.RefObject<HTMLInputElement>;
    completedAtRef: React.RefObject<HTMLInputElement>;
    /** Enter edit mode */
    startEditing: () => void;
    /** Cancel editing and revert changes, optionally overriding the restored subtasks */
    cancelEditing: (subtasksOverride?: Task['subtasks']) => void;

    /** Save changes to the task - returns the onSave promise or void */
    save: () => Promise<void> | void;
    /** Mark save as complete (call when task prop updates) */
    finishSaving: () => void;
    /** Directly set the edited task state */
    setEditedTask: React.Dispatch<React.SetStateAction<Task>>;

    /** Handler for status change */
    handleStatusChange: (status: TaskStatus) => void;
    /** Handler for priority change */
    handlePriorityChange: (priority: TaskPriority) => void;
    /** Handler for personal toggle change */
    handlePersonalChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** Handler for title change */
    handleTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** Handler for description change */
    handleDescriptionChange: (value: string) => void;
    /** Handler for due date change */
    handleDueDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** Handler for started at change */
    handleStartedAtChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** Handler for completed at change */
    handleCompletedAtChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** Sync subtasks from external source (e.g., live updates) */
    syncSubtasks: (subtasks: Task['subtasks']) => void;
    /** Reset editedTask to match the provided task (for task ID changes) */
    resetToTask: (task: Task) => void;
}

/**
 * Compares two date values for equality
 */
function datesEqual(d1: string | null | undefined, d2: string | null | undefined): boolean {
    if (!d1 && !d2) return true;
    if (!d1 || !d2) return false;
    return new Date(d1).getTime() === new Date(d2).getTime();
}

/**
 * Custom hook that encapsulates task editing logic shared between
 * TaskPanel and TaskPopout components.
 *
 * This hook manages:
 * - Edit mode state
 * - Local edited task state
 * - Field change handlers
 * - Save/cancel logic with change detection
 *
 * @example
 * ```tsx
 * const {
 *   editedTask,
 *   isEditing,
 *   startEditing,
 *   cancelEditing,
 *   save,
 *   handleTitleChange,
 *   handleStatusChange,
 *   // ...other handlers
 * } = useTaskEditor({
 *   task,
 *   onSave: (taskId, updates) => updateMutation.mutate({ id: taskId, updates }),
 * });
 * ```
 */
export function useTaskEditor({
    task,
    onSave,
    initialEditMode = false,
}: UseTaskEditorOptions): UseTaskEditorReturn {
    const [isEditing, setIsEditing] = useState(initialEditMode);
    const [editedTask, setEditedTask] = useState<Task>(task);
    const [isSaving, setIsSaving] = useState(false);

    // Refs for date picker inputs
    const dueDateRef = useRef<HTMLInputElement>(null);
    const startedAtRef = useRef<HTMLInputElement>(null);
    const completedAtRef = useRef<HTMLInputElement>(null);

    /**
     * Enter edit mode
     */
    const startEditing = useCallback(() => {
        setEditedTask(task);
        setIsEditing(true);
    }, [task]);

    /**
     * Cancel editing and revert changes
     */
    const cancelEditing = useCallback((subtasksOverride?: Task['subtasks']) => {
        setEditedTask({ ...task, subtasks: subtasksOverride !== undefined ? subtasksOverride : task.subtasks });
        setIsEditing(false);
    }, [task]);


    /**
     * Mark save as complete - call when task prop updates after save
     */
    const finishSaving = useCallback(() => {
        setIsSaving(false);
        setIsEditing(false);
    }, []);

    const save = useCallback(() => {
        const updates: Partial<Task> = {};

        if (editedTask.title !== task.title) updates.title = editedTask.title;
        if (editedTask.description !== task.description) updates.description = editedTask.description;
        if (editedTask.status !== task.status) updates.status = editedTask.status;
        if (editedTask.priority !== task.priority) updates.priority = editedTask.priority;
        if (editedTask.is_personal !== task.is_personal) updates.is_personal = editedTask.is_personal;
        if (!datesEqual(editedTask.due_date, task.due_date)) updates.due_date = editedTask.due_date;
        if (!datesEqual(editedTask.started_at, task.started_at)) updates.started_at = editedTask.started_at;
        if (!datesEqual(editedTask.completed_at, task.completed_at)) updates.completed_at = editedTask.completed_at;

        // Deep compare subtasks for changes
        const subtasksChanged = JSON.stringify(editedTask.subtasks) !== JSON.stringify(task.subtasks);
        if (subtasksChanged) {
            updates.subtasks = editedTask.subtasks;
        }

        if (Object.keys(updates).length > 0) {
            setIsSaving(true);
            return onSave(task.id, updates);
        } else {
            setIsEditing(false);
        }
    }, [editedTask, task, onSave]);


    /**
     * Handler for status change
     */
    const handleStatusChange = useCallback((status: TaskStatus) => {
        if (!isEditing) return;
        setEditedTask(prev => ({ ...prev, status }));
    }, [isEditing]);

    /**
     * Handler for priority change
     */
    const handlePriorityChange = useCallback((priority: TaskPriority) => {
        if (!isEditing) return;
        setEditedTask(prev => ({ ...prev, priority }));
    }, [isEditing]);

    /**
     * Handler for personal toggle change
     */
    const handlePersonalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isEditing) return;
        setEditedTask(prev => ({ ...prev, is_personal: e.target.checked }));
    }, [isEditing]);

    /**
     * Handler for title change
     */
    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedTask(prev => ({ ...prev, title: e.target.value }));
    }, []);

    /**
     * Handler for description change
     */
    const handleDescriptionChange = useCallback((value: string) => {
        if (!isEditing) return;
        setEditedTask(prev => ({ ...prev, description: value }));
    }, [isEditing]);

    /**
     * Handler for due date change
     */
    const handleDueDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedTask(prev => ({ ...prev, due_date: e.target.value || null }));
    }, []);

    /**
     * Handler for started at change
     */
    const handleStartedAtChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedTask(prev => ({ ...prev, started_at: e.target.value || null }));
    }, []);

    /**
     * Handler for completed at change
     */
    const handleCompletedAtChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedTask(prev => ({ ...prev, completed_at: e.target.value || null }));
    }, []);

    /**
     * Sync subtasks from external source (e.g., live updates from backend)
     */
    const syncSubtasks = useCallback((subtasks: Task['subtasks']) => {
        setEditedTask(prev => ({ ...prev, subtasks }));
    }, []);

    /**
     * Reset editedTask to match the provided task (for task ID changes)
     */
    const resetToTask = useCallback((newTask: Task) => {
        setEditedTask(newTask);
        setIsEditing(initialEditMode);
    }, [initialEditMode]);

    return {
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
        setEditedTask,
    };
}


export default useTaskEditor;
