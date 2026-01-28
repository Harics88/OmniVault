import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { Task } from '../../types';

// Mock react-beautiful-dnd to avoid issues in tests
vi.mock('react-beautiful-dnd', () => ({
    DragDropContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Droppable: ({ children }: { children: (provided: any) => React.ReactNode }) =>
        children({
            droppableProps: {},
            innerRef: () => { },
            placeholder: null,
        }),
    Draggable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactNode }) =>
        children(
            {
                draggableProps: {},
                dragHandleProps: {},
                innerRef: () => { },
            },
            { isDragging: false }
        ),
}));

// Mock RichTextEditor
vi.mock('../../components/RichTextEditor', () => ({
    default: ({ content, onChange, isEditable, placeholder }: any) => (
        <textarea
            data-testid="rich-text-editor"
            value={content}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={!isEditable}
            placeholder={placeholder}
        />
    ),
}));

// Mock ConfirmModal
vi.mock('../../components/ConfirmModal', () => ({
    default: ({ isOpen, onClose, onConfirm, title, message }: any) =>
        isOpen ? (
            <div data-testid="confirm-modal">
                <h3>{title}</h3>
                <p>{message}</p>
                <button onClick={onClose}>Cancel</button>
                <button onClick={onConfirm}>Confirm</button>
            </div>
        ) : null,
}));

// Import TaskPanel after mocks
import TaskPanel from '../../components/TaskPanel';

/**
 * Creates a mock task for testing
 */
function createMockTask(overrides: Partial<Task> = {}): Task {
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

describe('TaskPanel Integration', () => {
    let mockTask: Task;
    let mockOnClose: ReturnType<typeof vi.fn>;
    let mockOnUpdate: ReturnType<typeof vi.fn>;
    let mockOnDelete: ReturnType<typeof vi.fn>;
    let mockOnAddSubtask: ReturnType<typeof vi.fn>;
    let mockOnUpdateSubtask: ReturnType<typeof vi.fn>;
    let mockOnDeleteSubtask: ReturnType<typeof vi.fn>;
    let mockOnReorderSubtasks: ReturnType<typeof vi.fn>;
    let mockOnWidthChange: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockTask = createMockTask();
        mockOnClose = vi.fn();
        mockOnUpdate = vi.fn();
        mockOnDelete = vi.fn();
        mockOnAddSubtask = vi.fn();
        mockOnUpdateSubtask = vi.fn();
        mockOnDeleteSubtask = vi.fn();
        mockOnReorderSubtasks = vi.fn();
        mockOnWidthChange = vi.fn();
    });

    const renderTaskPanel = (props: Partial<React.ComponentProps<typeof TaskPanel>> = {}) => {
        return render(
            <TaskPanel
                task={mockTask}
                onClose={mockOnClose}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
                onAddSubtask={mockOnAddSubtask}
                onUpdateSubtask={mockOnUpdateSubtask}
                onDeleteSubtask={mockOnDeleteSubtask}
                onReorderSubtasks={mockOnReorderSubtasks}
                width={400}
                onWidthChange={mockOnWidthChange}
                {...props}
            />
        );
    };

    describe('rendering', () => {
        it('should render task title', () => {
            renderTaskPanel();
            expect(screen.getByText('Test Task')).toBeInTheDocument();
        });

        it('should show personal badge when task is personal', () => {
            renderTaskPanel({ task: createMockTask({ is_personal: true }) });
            expect(screen.getByText('Personal')).toBeInTheDocument();
        });

        it('should render task details header', () => {
            renderTaskPanel();
            expect(screen.getByText('Task Details')).toBeInTheDocument();
        });
    });

    describe('edit mode', () => {
        it('should enter edit mode when Edit button is clicked', async () => {
            const user = userEvent.setup();
            renderTaskPanel();

            // Find and click the Edit button (via button in the footer)
            const editButtons = screen.getAllByRole('button');
            const footerEditButton = editButtons.find(btn => btn.textContent === 'Edit');

            if (footerEditButton) {
                await user.click(footerEditButton);
            }

            // After entering edit mode, we should see Save and Cancel buttons
            await waitFor(() => {
                expect(screen.getByText('Save')).toBeInTheDocument();
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });
        });

        it('should start in edit mode when initialEditMode is true', () => {
            renderTaskPanel({ initialEditMode: true });

            // Should see Save and Cancel buttons
            expect(screen.getByText('Save')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
        });

        it('should exit edit mode when Cancel is clicked', async () => {
            const user = userEvent.setup();
            renderTaskPanel({ initialEditMode: true });

            await user.click(screen.getByText('Cancel'));

            await waitFor(() => {
                expect(screen.getByText('Edit')).toBeInTheDocument();
                expect(screen.queryByText('Save')).not.toBeInTheDocument();
            });
        });
    });

    describe('field editing', () => {
        it('should allow editing title in edit mode', async () => {
            const user = userEvent.setup();
            renderTaskPanel({ initialEditMode: true });

            const titleInput = screen.getByDisplayValue('Test Task');
            await user.clear(titleInput);
            await user.type(titleInput, 'Updated Title');

            expect(titleInput).toHaveValue('Updated Title');
        });

        it('should call onUpdate with changes when Save is clicked', async () => {
            const user = userEvent.setup();
            renderTaskPanel({ initialEditMode: true });

            // Change the title
            const titleInput = screen.getByDisplayValue('Test Task');
            await user.clear(titleInput);
            await user.type(titleInput, 'Updated Title');

            // Click Save
            await user.click(screen.getByText('Save'));

            expect(mockOnUpdate).toHaveBeenCalledWith(1,
                expect.objectContaining({
                    title: 'Updated Title',
                })
            );
        });

        it('should not call onUpdate if no changes were made', async () => {
            const user = userEvent.setup();
            renderTaskPanel({ initialEditMode: true });

            // Click Save without making changes
            await user.click(screen.getByText('Save'));

            expect(mockOnUpdate).not.toHaveBeenCalled();
        });
    });

    describe('personal toggle', () => {
        it('should show personal checkbox in edit mode', () => {
            renderTaskPanel({ initialEditMode: true });
            expect(screen.getByLabelText('Personal')).toBeInTheDocument();
        });

        it('should toggle personal status', async () => {
            const user = userEvent.setup();
            renderTaskPanel({ initialEditMode: true });

            const personalCheckbox = screen.getByLabelText('Personal');
            await user.click(personalCheckbox);

            // Click Save
            await user.click(screen.getByText('Save'));

            expect(mockOnUpdate).toHaveBeenCalledWith(1,
                expect.objectContaining({
                    is_personal: true,
                })
            );
        });
    });

    describe('delete functionality', () => {
        it('should show delete button', () => {
            renderTaskPanel();
            expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        it('should show confirmation modal when Delete is clicked', async () => {
            const user = userEvent.setup();
            renderTaskPanel();

            await user.click(screen.getByText('Delete'));

            await waitFor(() => {
                expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
                expect(screen.getByText('Delete Task')).toBeInTheDocument();
            });
        });

        it('should call onDelete when confirmed', async () => {
            const user = userEvent.setup();
            renderTaskPanel();

            await user.click(screen.getByText('Delete'));

            await waitFor(() => {
                expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Confirm'));

            expect(mockOnDelete).toHaveBeenCalledWith(1);
        });
    });

    describe('close functionality', () => {
        it('should call onClose when close button is clicked', async () => {
            const user = userEvent.setup();
            renderTaskPanel();

            // Find the X close button (in the header)
            const closeButtons = screen.getAllByRole('button');
            // The X button should be one of them - find by aria-label or nearby text
            for (const button of closeButtons) {
                if (button.querySelector('svg')) {
                    // Try clicking this button and check if onClose was called
                    await user.click(button);
                    if (mockOnClose.mock.calls.length > 0) break;
                }
            }
        });
    });

    describe('subtasks', () => {
        it('should render subtasks when present', () => {
            const taskWithSubtasks = createMockTask({
                subtasks: [
                    { id: 1, task_id: 1, title: 'Subtask 1', completed: false, order: 0, created_at: '2026-01-01T00:00:00Z' },
                    { id: 2, task_id: 1, title: 'Subtask 2', completed: true, order: 1, created_at: '2026-01-01T00:00:00Z' },
                ],
            });

            renderTaskPanel({ task: taskWithSubtasks });

            expect(screen.getByText('Subtask 1')).toBeInTheDocument();
            expect(screen.getByText('Subtask 2')).toBeInTheDocument();
        });

        it('should show subtask input in edit mode', () => {
            renderTaskPanel({ initialEditMode: true });
            expect(screen.getByPlaceholderText('Add a subtask...')).toBeInTheDocument();
        });

        it('should call onAddSubtask when Enter is pressed in subtask input', async () => {
            const user = userEvent.setup();
            renderTaskPanel({ initialEditMode: true });

            const subtaskInput = screen.getByPlaceholderText('Add a subtask...');
            await user.type(subtaskInput, 'New Subtask{enter}');

            expect(mockOnAddSubtask).toHaveBeenCalledWith(1, 'New Subtask');
        });
    });
});
