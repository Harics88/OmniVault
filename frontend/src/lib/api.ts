import axios from 'axios';
import type {
    DailyLog,
    Task,
    Note,
    Snippet,
    Bookmark,
    SearchResult,
    LinkableItems,
    CreateTask,
    UpdateTask,
    CreateNote,
    UpdateNote,
    CreateSnippet,
    UpdateSnippet,
    CreateBookmark,
    UpdateBookmark,
    BookmarkCategory,
    CreateBookmarkCategory,
    UpdateBookmarkCategory,
} from '../types';

const API_BASE = '/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============ Daily Logs API ============

export const dailyLogsApi = {
    getAll: async (skip = 0, limit = 30): Promise<DailyLog[]> => {
        const { data } = await api.get(`/daily-logs/?skip=${skip}&limit=${limit}`);
        return data;
    },

    getToday: async (): Promise<DailyLog> => {
        const { data } = await api.get('/daily-logs/today');
        return data;
    },

    getByDate: async (date: string): Promise<DailyLog> => {
        const { data } = await api.get(`/daily-logs/date/${date}`);
        return data;
    },

    getById: async (id: number): Promise<DailyLog> => {
        const { data } = await api.get(`/daily-logs/${id}`);
        return data;
    },

    updateByDate: async (date: string, content: string): Promise<DailyLog> => {
        const { data } = await api.put(`/daily-logs/date/${date}`, { content });
        return data;
    },

    update: async (id: number, content: string): Promise<DailyLog> => {
        const { data } = await api.put(`/daily-logs/${id}`, { content });
        return data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/daily-logs/${id}`);
    },
};

// ============ Tasks API ============

export const tasksApi = {
    getAll: async (status?: string): Promise<Task[]> => {
        const params = status ? `?status=${status}` : '';
        const { data } = await api.get(`/tasks/${params}`);
        return data;
    },

    getStats: async (): Promise<{ total: number; by_status: Record<string, number> }> => {
        const { data } = await api.get('/tasks/stats');
        return data;
    },

    getById: async (id: number): Promise<Task> => {
        const { data } = await api.get(`/tasks/${id}`);
        return data;
    },

    create: async (task: CreateTask): Promise<Task> => {
        const { data } = await api.post('/tasks/', task);
        return data;
    },

    update: async (id: number, task: UpdateTask): Promise<Task> => {
        const { data } = await api.put(`/tasks/${id}`, task);
        return data;
    },

    reorder: async (taskIds: number[]): Promise<void> => {
        await api.post('/tasks/reorder', { task_ids: taskIds });
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/tasks/${id}`);
    },

    // Subtask methods
    createSubtask: async (taskId: number, subtask: { title: string; completed?: boolean }) => {
        const { data } = await api.post(`/tasks/${taskId}/subtasks`, subtask);
        return data;
    },

    updateSubtask: async (taskId: number, subtaskId: number, updates: { title?: string; completed?: boolean }) => {
        const { data } = await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, updates);
        return data;
    },

    deleteSubtask: async (taskId: number, subtaskId: number): Promise<void> => {
        await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
    },
};

// ============ Notes API ============

export const notesApi = {
    getAll: async (search?: string): Promise<Note[]> => {
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        const { data } = await api.get(`/notes/${params}`);
        return data;
    },

    getRecent: async (limit = 5): Promise<Note[]> => {
        const { data } = await api.get(`/notes/recent?limit=${limit}`);
        return data;
    },

    getById: async (id: number): Promise<Note> => {
        const { data } = await api.get(`/notes/${id}`);
        return data;
    },

    create: async (note: CreateNote): Promise<Note> => {
        const { data } = await api.post('/notes/', note);
        return data;
    },

    update: async (id: number, note: UpdateNote): Promise<Note> => {
        const { data } = await api.put(`/notes/${id}`, note);
        return data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/notes/${id}`);
    },
};

// ============ Snippets API ============

export const snippetsApi = {
    getAll: async (language?: string, search?: string): Promise<Snippet[]> => {
        const params = new URLSearchParams();
        if (language) params.append('language', language);
        if (search) params.append('search', search);
        const queryString = params.toString();
        const { data } = await api.get(`/snippets/${queryString ? `?${queryString}` : ''}`);
        return data;
    },

    getLanguages: async (): Promise<string[]> => {
        const { data } = await api.get('/snippets/languages');
        return data.languages;
    },

    getRecent: async (limit = 5): Promise<Snippet[]> => {
        const { data } = await api.get(`/snippets/recent?limit=${limit}`);
        return data;
    },

    getById: async (id: number): Promise<Snippet> => {
        const { data } = await api.get(`/snippets/${id}`);
        return data;
    },

    create: async (snippet: CreateSnippet): Promise<Snippet> => {
        const { data } = await api.post('/snippets/', snippet);
        return data;
    },

    update: async (id: number, snippet: UpdateSnippet): Promise<Snippet> => {
        const { data } = await api.put(`/snippets/${id}`, snippet);
        return data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/snippets/${id}`);
    },
};

// ============ Bookmarks API ============

export const bookmarksApi = {
    // Categories
    getCategories: async (): Promise<BookmarkCategory[]> => {
        const { data } = await api.get('/bookmarks/categories');
        return data;
    },

    createCategory: async (category: CreateBookmarkCategory): Promise<BookmarkCategory> => {
        const { data } = await api.post('/bookmarks/categories', category);
        return data;
    },

    updateCategory: async (id: number, category: UpdateBookmarkCategory): Promise<BookmarkCategory> => {
        const { data } = await api.put(`/bookmarks/categories/${id}`, category);
        return data;
    },

    deleteCategory: async (id: number): Promise<void> => {
        await api.delete(`/bookmarks/categories/${id}`);
    },

    // Bookmarks
    getAll: async (params: { search?: string; category_id?: number; skip?: number; limit?: number } = {}): Promise<Bookmark[]> => {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append('search', params.search);
        if (params.category_id) queryParams.append('category_id', params.category_id.toString());
        if (params.skip) queryParams.append('skip', params.skip.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());

        const queryString = queryParams.toString();
        const { data } = await api.get(`/bookmarks/${queryString ? `?${queryString}` : ''}`);
        return data;
    },

    getRecent: async (limit = 5): Promise<Bookmark[]> => {
        const { data } = await api.get(`/bookmarks/recent?limit=${limit}`);
        return data;
    },

    getById: async (id: number): Promise<Bookmark> => {
        const { data } = await api.get(`/bookmarks/${id}`);
        return data;
    },

    create: async (bookmark: CreateBookmark): Promise<Bookmark> => {
        const { data } = await api.post('/bookmarks/', bookmark);
        return data;
    },

    update: async (id: number, bookmark: UpdateBookmark): Promise<Bookmark> => {
        const { data } = await api.put(`/bookmarks/${id}`, bookmark);
        return data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/bookmarks/${id}`);
    },

    open: async (id: number): Promise<void> => {
        await api.post(`/bookmarks/${id}/open`);
    },
};

// ============ Search API ============

export const searchApi = {
    search: async (query: string): Promise<{ results: SearchResult[]; total: number }> => {
        const { data } = await api.get(`/search/?q=${encodeURIComponent(query)}`);
        return data;
    },

    getLinkableItems: async (query = ''): Promise<LinkableItems> => {
        const params = query ? `?q=${encodeURIComponent(query)}` : '';
        const { data } = await api.get(`/search/linkable${params}`);
        return data;
    },
};

export default api;
