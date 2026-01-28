// API Types for MyTasker

export type TaskStatus = 'not_started' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

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
    priority: TaskPriority;
    due_date: string | null;
    started_at: string | null;
    completed_at: string | null;
    is_personal: boolean;
    order: number;
    subtasks: Subtask[];
    created_at: string;
    updated_at: string;
}

// ... (skipping unchanged parts)

export interface CreateTask {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
    is_personal?: boolean;
    subtasks?: CreateSubtask[];
}

export interface UpdateTask {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    is_personal?: boolean;
    order?: number;
}

export interface NoteSection {
    id: number;
    name: string;
    color: string;
    icon: string;
    position: number;
    created_at: string;
}

export interface Note {
    id: number;
    title: string;
    content: string;
    icon: string;
    parent_id: number | null;
    position: number;
    section_id: number | null;
    is_pinned: boolean;
    tags: string;
    section: NoteSection | null;
    deleted_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface NoteTreeItem {
    id: number;
    title: string;
    icon: string;
    parent_id: number | null;
    section_id: number | null;
    position: number;
    is_pinned: boolean;
    children: NoteTreeItem[];
    created_at: string;
    updated_at: string;
}

export interface NoteBreadcrumb {
    id: number;
    title: string;
    icon: string;
}


export interface Snippet {
    id: number;
    title: string;
    code: string;
    language: string;
    is_pinned: boolean;
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
    metadata?: {
        date?: string;
    };
}

export interface LinkableItems {
    tasks: { id: number; title: string; status: string }[];
    notes: { id: number; title: string }[];
    snippets: { id: number; title: string; language: string }[];
    bookmarks: { id: number; title: string; url: string }[];
    daily_logs: { id: number; title: string; date: string }[];
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
    priority?: TaskPriority;
    due_date?: string | null;
    is_personal?: boolean;
    subtasks?: CreateSubtask[];
}

export interface UpdateTask {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    is_personal?: boolean;
    order?: number;
}

export interface CreateNote {
    title: string;
    content?: string;
    icon?: string;
    parent_id?: number | null;
    position?: number;
    section_id?: number | null;
    is_pinned?: boolean;
    tags?: string;
}

export interface UpdateNote {
    title?: string;
    content?: string;
    icon?: string;
    parent_id?: number | null;
    position?: number;
    section_id?: number | null;
    is_pinned?: boolean;
    tags?: string;
}

export interface CreateNoteSection {
    name: string;
    color?: string;
    icon?: string;
    position?: number;
}

export interface UpdateNoteSection {
    name?: string;
    color?: string;
    icon?: string;
    position?: number;
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
    is_pinned?: boolean;
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

// Vault/Secret types
export type SecretType = 'database' | 'sftp' | 'website';

export interface Secret {
    id: number;
    type: SecretType;
    label: string;
    metadata: string; // JSON string
    tags?: string;
    username: string | null;
    password: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface DatabaseMetadata {
    host: string;
    port: number;
    db_type: 'postgresql' | 'mysql' | 'oracle' | 'mssql';
    sid?: string; // For Oracle
    database?: string; // For Postgres/MySQL
}

export interface SFTPMetadata {
    host: string;
    port: number;
    url?: string;
    ssh_key_path?: string;
}

export interface WebsiteMetadata {
    url: string;
}

export interface CreateSecret {
    type: SecretType;
    label: string;
    metadata: string;
    tags?: string;
    username?: string | null;
    password: string;
    notes?: string | null;
}

export interface UpdateSecret {
    type?: SecretType;
    label?: string;
    metadata?: string;
    tags?: string;
    username?: string | null;
    password?: string;
    notes?: string | null;
}

export interface ConnectionString {
    connection_string: string;
    host: string;
    port: number;
    database: string;
    db_type: string;
}

