// API Types for MyTasker

export type TaskStatus = 'not_started' | 'in_progress' | 'done';

export interface DailyLog {
    id: number;
    date: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface Subtask {
    id: number;
    task_id: number;
    title: string;
    completed: boolean;
    order: number;
    created_at: string;
}

export interface Task {
    id: number;
    title: string;
    description: string;
    status: TaskStatus;
    due_date: string | null;
    started_at: string | null;
    completed_at: string | null;
    order: number;
    subtasks: Subtask[];
    created_at: string;
    updated_at: string;
}

export interface Note {
    id: number;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface Snippet {
    id: number;
    title: string;
    code: string;
    language: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface BookmarkCategory {
    id: number;
    name: string;
    color: string;
    order: number;
    created_at: string;
}

export interface Bookmark {
    id: number;
    category_id: number | null;
    title: string;
    url: string;
    description: string;
    icon: string | null;
    is_file: boolean;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface SearchResult {
    type: 'task' | 'note' | 'snippet' | 'bookmark' | 'daily_log';
    id: number;
    title: string;
    preview: string;
    updated_at: string;
}

export interface LinkableItems {
    tasks: { id: number; title: string; status: string }[];
    notes: { id: number; title: string }[];
    snippets: { id: number; title: string; language: string }[];
    bookmarks: { id: number; title: string; url: string }[];
}

// Subtask types
export interface CreateSubtask {
    title: string;
    completed?: boolean;
}

export interface UpdateSubtask {
    title?: string;
    completed?: boolean;
    order?: number;
}

// Create/Update types
export interface CreateTask {
    title: string;
    description?: string;
    status?: TaskStatus;
    due_date?: string | null;
    subtasks?: CreateSubtask[];
}

export interface UpdateTask {
    title?: string;
    description?: string;
    status?: TaskStatus;
    due_date?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    order?: number;
}

export interface CreateNote {
    title: string;
    content?: string;
}

export interface UpdateNote {
    title?: string;
    content?: string;
}

export interface CreateSnippet {
    title: string;
    code: string;
    language?: string;
    description?: string;
}

export interface UpdateSnippet {
    title?: string;
    code?: string;
    language?: string;
    description?: string;
}

export interface CreateBookmarkCategory {
    name: string;
    color?: string;
    order?: number;
}

export interface UpdateBookmarkCategory {
    name?: string;
    color?: string;
    order?: number;
}

export interface CreateBookmark {
    title: string;
    url: string;
    description?: string;
    category_id?: number | null;
    icon?: string | null;
    is_file?: boolean;
    order?: number;
}

export interface UpdateBookmark {
    title?: string;
    url?: string;
    description?: string;
    category_id?: number | null;
    icon?: string | null;
    is_file?: boolean;
    order?: number;
}
