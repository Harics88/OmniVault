import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Simple mock Task type for testing
interface MockTask {
    id: number;
    title: string;
    description: string;
    status: 'not_started' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    is_personal: boolean;
    due_date: string | null;
    started_at: string | null;
    completed_at: string | null;
    order: number;
    subtasks: any[];
    created_at: string;
    updated_at: string;
}

/**
 * Creates a mock task for testing
 */
function createMockTask(overrides: Partial<MockTask> = {}): MockTask {
    return {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        status: 'not_started',
        priority: 'medium',
        is_personal: false,
        due_date: null,
        started_at: null,
        completed_at: null,
        order: 0,
        subtasks: [],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        ...overrides,
    };
}

// Import the hook after defining types
import { useTaskEditor } from '../useTaskEditor';

describe('useTaskEditor', () => {
    let mockOnSave: ReturnType<typeof vi.fn>;
    let mockTask: MockTask;

    beforeEach(() => {
        mockOnSave = vi.fn();
        mockTask = createMockTask();
    });

    describe('initialization', () => {
        it('should initialize with task data', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave })
            );

            expect(result.current.editedTask.title).toBe(mockTask.title);
            expect(result.current.isEditing).toBe(false);
            expect(result.current.isSaving).toBe(false);
        });

        it('should start in edit mode when initialEditMode is true', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: true })
            );

            expect(result.current.isEditing).toBe(true);
        });

        it('should provide date refs', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave })
            );

            expect(result.current.dueDateRef).toBeDefined();
            expect(result.current.startedAtRef).toBeDefined();
            expect(result.current.completedAtRef).toBeDefined();
        });
    });

    describe('editing mode', () => {
        it('should enter edit mode when startEditing is called', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave })
            );

            act(() => {
                result.current.startEditing();
            });

            expect(result.current.isEditing).toBe(true);
        });

        it('should exit edit mode and reset changes when cancelEditing is called', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: true })
            );

            // Make a change
            act(() => {
                result.current.handleTitleChange({
                    target: { value: 'Changed Title' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.editedTask.title).toBe('Changed Title');

            // Cancel
            act(() => {
                result.current.cancelEditing();
            });

            expect(result.current.isEditing).toBe(false);
            expect(result.current.editedTask.title).toBe(mockTask.title);
        });
    });

    describe('field change handlers', () => {
        it('should update title when handleTitleChange is called', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave })
            );

            act(() => {
                result.current.handleTitleChange({
                    target: { value: 'New Title' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.editedTask.title).toBe('New Title');
        });

        it('should update description when handleDescriptionChange is called in edit mode', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: true })
            );

            act(() => {
                result.current.handleDescriptionChange('New Description');
            });

            expect(result.current.editedTask.description).toBe('New Description');
        });

        it('should NOT update description when not in edit mode', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: false })
            );

            act(() => {
                result.current.handleDescriptionChange('New Description');
            });

            expect(result.current.editedTask.description).toBe(mockTask.description);
        });

        it('should update status when handleStatusChange is called in edit mode', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: true })
            );

            act(() => {
                result.current.handleStatusChange('in_progress');
            });

            expect(result.current.editedTask.status).toBe('in_progress');
        });

        it('should NOT update status when not in edit mode', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: false })
            );

            act(() => {
                result.current.handleStatusChange('done');
            });

            expect(result.current.editedTask.status).toBe('not_started');
        });

        it('should update priority when handlePriorityChange is called in edit mode', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: true })
            );

            act(() => {
                result.current.handlePriorityChange('high');
            });

            expect(result.current.editedTask.priority).toBe('high');
        });

        it('should update is_personal when handlePersonalChange is called in edit mode', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: true })
            );

            act(() => {
                result.current.handlePersonalChange({
                    target: { checked: true },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.editedTask.is_personal).toBe(true);
        });

        it('should update due_date when handleDueDateChange is called', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave })
            );

            act(() => {
                result.current.handleDueDateChange({
                    target: { value: '2026-02-15T10:00' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.editedTask.due_date).toBe('2026-02-15T10:00');
        });

        it('should set due_date to null when empty string is provided', () => {
            const taskWithDueDate = createMockTask({ due_date: '2026-01-15T10:00:00Z' });
            const { result } = renderHook(() =>
                useTaskEditor({ task: taskWithDueDate as any, onSave: mockOnSave })
            );

            act(() => {
                result.current.handleDueDateChange({
                    target: { value: '' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.editedTask.due_date).toBeNull();
        });

        it('should update started_at when handleStartedAtChange is called', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave })
            );

            act(() => {
                result.current.handleStartedAtChange({
                    target: { value: '2026-01-20T09:00' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.editedTask.started_at).toBe('2026-01-20T09:00');
        });

        it('should update completed_at when handleCompletedAtChange is called', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave })
            );

            act(() => {
                result.current.handleCompletedAtChange({
                    target: { value: '2026-01-25T17:00' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.editedTask.completed_at).toBe('2026-01-25T17:00');
        });
    });

    describe('save functionality', () => {
        it('should call onSave with only changed fields', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: true })
            );

            act(() => {
                result.current.handleTitleChange({
                    target: { value: 'Updated Title' },
                } as React.ChangeEvent<HTMLInputElement>);
                result.current.handleStatusChange('done');
            });

            act(() => {
                result.current.save();
            });

            expect(mockOnSave).toHaveBeenCalledWith(mockTask.id, {
                title: 'Updated Title',
                status: 'done',
            });
            expect(result.current.isSaving).toBe(true);
        });

        it('should not call onSave if no changes were made', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: true })
            );

            act(() => {
                result.current.save();
            });

            expect(mockOnSave).not.toHaveBeenCalled();
            expect(result.current.isEditing).toBe(false);
        });

        it('should detect date changes correctly', () => {
            const taskWithDueDate = createMockTask({ due_date: '2026-01-15T10:00:00Z' });
            const { result } = renderHook(() =>
                useTaskEditor({ task: taskWithDueDate as any, onSave: mockOnSave, initialEditMode: true })
            );

            act(() => {
                result.current.handleDueDateChange({
                    target: { value: '2026-02-20T10:00' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            act(() => {
                result.current.save();
            });

            expect(mockOnSave).toHaveBeenCalledWith(taskWithDueDate.id, {
                due_date: '2026-02-20T10:00',
            });
        });

        it('should finish saving when finishSaving is called', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: true })
            );

            // Make a change and save
            act(() => {
                result.current.handleTitleChange({
                    target: { value: 'New Title' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            act(() => {
                result.current.save();
            });

            expect(result.current.isSaving).toBe(true);

            // Finish saving
            act(() => {
                result.current.finishSaving();
            });

            expect(result.current.isSaving).toBe(false);
            expect(result.current.isEditing).toBe(false);
        });
    });

    describe('subtask synchronization', () => {
        it('should sync subtasks when syncSubtasks is called', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave })
            );

            const newSubtasks = [
                { id: 1, task_id: 1, title: 'Subtask 1', completed: false, order: 0, created_at: '2026-01-01T00:00:00Z' },
                { id: 2, task_id: 1, title: 'Subtask 2', completed: true, order: 1, created_at: '2026-01-01T00:00:00Z' },
            ];

            act(() => {
                result.current.syncSubtasks(newSubtasks);
            });

            expect(result.current.editedTask.subtasks).toEqual(newSubtasks);
        });
    });

    describe('task reset', () => {
        it('should reset to new task when resetToTask is called', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: true })
            );

            // Make changes
            act(() => {
                result.current.handleTitleChange({
                    target: { value: 'Changed Title' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            // Reset to a new task
            const newTask = createMockTask({ id: 2, title: 'New Task' });
            act(() => {
                result.current.resetToTask(newTask as any);
            });

            expect(result.current.editedTask.title).toBe('New Task');
            expect(result.current.isEditing).toBe(true); // Should respect initialEditMode
        });
    });

    describe('edge cases', () => {
        it('should handle task with all null date values', () => {
            const taskWithNullDates = createMockTask({
                due_date: null,
                started_at: null,
                completed_at: null,
            });

            const { result } = renderHook(() =>
                useTaskEditor({ task: taskWithNullDates as any, onSave: mockOnSave, initialEditMode: true })
            );

            // No changes made, save should not call onSave
            act(() => {
                result.current.save();
            });

            expect(mockOnSave).not.toHaveBeenCalled();
        });

        it('should handle updating multiple fields at once', () => {
            const { result } = renderHook(() =>
                useTaskEditor({ task: mockTask as any, onSave: mockOnSave, initialEditMode: true })
            );

            act(() => {
                result.current.handleTitleChange({ target: { value: 'New Title' } } as React.ChangeEvent<HTMLInputElement>);
                result.current.handleDescriptionChange('New Description');
                result.current.handleStatusChange('in_progress');
                result.current.handlePriorityChange('high');
                result.current.handlePersonalChange({ target: { checked: true } } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.editedTask.title).toBe('New Title');
            expect(result.current.editedTask.description).toBe('New Description');
            expect(result.current.editedTask.status).toBe('in_progress');
            expect(result.current.editedTask.priority).toBe('high');
            expect(result.current.editedTask.is_personal).toBe(true);
        });

        it('should maintain other fields when updating one field', () => {
            const fullTask = createMockTask({
                title: 'Original Title',
                description: 'Original Description',
                status: 'in_progress',
                priority: 'high',
            });

            const { result } = renderHook(() =>
                useTaskEditor({ task: fullTask as any, onSave: mockOnSave })
            );

            act(() => {
                result.current.handleTitleChange({
                    target: { value: 'New Title' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.editedTask.title).toBe('New Title');
            expect(result.current.editedTask.description).toBe('Original Description');
            expect(result.current.editedTask.status).toBe('in_progress');
            expect(result.current.editedTask.priority).toBe('high');
        });
    });
});
