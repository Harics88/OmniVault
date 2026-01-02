import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Bookmark, Search, Loader2, X, FolderPlus, Globe, FileText, Palette, Check } from 'lucide-react';
import { bookmarksApi } from '../lib/api';
import type { Bookmark as BookmarkType, BookmarkCategory, CreateBookmark, UpdateBookmark, CreateBookmarkCategory, UpdateBookmarkCategory } from '../types';
import BookmarkCategoryCard from '../components/BookmarkCategoryCard';

export default function Bookmarks() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreatingBookmark, setIsCreatingBookmark] = useState(false);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [editingCategory, setEditingCategory] = useState<BookmarkCategory | null>(null);
    const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    // Queries
    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['bookmark-categories'],
        queryFn: () => bookmarksApi.getCategories(),
    });

    const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery({
        queryKey: ['bookmarks', searchQuery],
        queryFn: () => bookmarksApi.getAll({ search: searchQuery }),
    });

    // Mutations - Categories
    const createCategoryMutation = useMutation({
        mutationFn: (category: CreateBookmarkCategory) => bookmarksApi.createCategory(category),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmark-categories'] });
            setIsCreatingCategory(false);
        },
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, category }: { id: number; category: UpdateBookmarkCategory }) => bookmarksApi.updateCategory(id, category),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmark-categories'] });
            setEditingCategory(null);
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: number) => bookmarksApi.deleteCategory(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmark-categories'] }),
    });

    // Mutations - Bookmarks
    const createBookmarkMutation = useMutation({
        mutationFn: (bookmark: CreateBookmark) => bookmarksApi.create(bookmark),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
            setIsCreatingBookmark(false);
            setSelectedCategoryId(null);
        },
    });

    const updateBookmarkMutation = useMutation({
        mutationFn: ({ id, bookmark }: { id: number; bookmark: UpdateBookmark }) => bookmarksApi.update(id, bookmark),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
            setEditingBookmark(null);
        },
    });

    const deleteBookmarkMutation = useMutation({
        mutationFn: (id: number) => bookmarksApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
    });

    const openBookmarkMutation = useMutation({
        mutationFn: (id: number) => bookmarksApi.open(id),
    });

    if (categoriesLoading || bookmarksLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    const bookmarksByCategory = (catId: number | null) =>
        bookmarks.filter(b => b.category_id === catId);

    return (
        <div className="h-full flex flex-col animate-fade-in bg-background">
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                            <Bookmark size={24} className="text-accent-blue" />
                            Bookmark Manager
                        </h1>
                        <div className="relative w-64 md:w-80">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search bookmarks..."
                                className="input pl-9 h-9 text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCreatingCategory(true)}
                            className="btn btn-ghost gap-2 h-9"
                        >
                            <FolderPlus size={18} /> New Category
                        </button>
                        <button
                            onClick={() => { setSelectedCategoryId(null); setIsCreatingBookmark(true); }}
                            className="btn btn-primary gap-2 h-9"
                        >
                            <Plus size={18} /> Add Bookmark
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="flex flex-wrap gap-6 items-start">
                    {categories.map((cat: BookmarkCategory) => (
                        <BookmarkCategoryCard
                            key={cat.id}
                            category={cat}
                            bookmarks={bookmarksByCategory(cat.id)}
                            onAddBookmark={(catId: number) => { setSelectedCategoryId(catId); setIsCreatingBookmark(true); }}
                            onDeleteCategory={(id: number) => deleteCategoryMutation.mutate(id)}
                            onEditCategory={(c: BookmarkCategory) => setEditingCategory(c)}
                            onDeleteBookmark={(id: number) => deleteBookmarkMutation.mutate(id)}
                            onEditBookmark={(b: BookmarkType) => setEditingBookmark(b)}
                            onOpenBookmark={(b: BookmarkType) => {
                                if (b.is_file) {
                                    openBookmarkMutation.mutate(b.id);
                                } else {
                                    let url = b.url;
                                    if (!/^https?:\/\//i.test(url)) {
                                        url = 'https://' + url;
                                    }
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                }
                            }}
                        />
                    ))}

                    {/* Uncategorized column if there are any uncategorized bookmarks */}
                    {bookmarksByCategory(null).length > 0 && (
                        <BookmarkCategoryCard
                            category={{ id: 0, name: 'Uncategorized', color: '#9CA3AF', order: 999, created_at: '' } as BookmarkCategory}
                            bookmarks={bookmarksByCategory(null)}
                            onAddBookmark={() => { setSelectedCategoryId(null); setIsCreatingBookmark(true); }}
                            onDeleteCategory={() => { }}
                            onEditCategory={() => { }}
                            onDeleteBookmark={(id: number) => deleteBookmarkMutation.mutate(id)}
                            onEditBookmark={(b: BookmarkType) => setEditingBookmark(b)}
                            onOpenBookmark={(b: BookmarkType) => {
                                if (b.is_file) {
                                    openBookmarkMutation.mutate(b.id);
                                } else {
                                    let url = b.url;
                                    if (!/^https?:\/\//i.test(url)) {
                                        url = 'https://' + url;
                                    }
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                }
                            }}
                        />
                    )}

                    {categories.length === 0 && bookmarks.length === 0 && (
                        <div className="w-full flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-background-card border border-border rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <Bookmark size={40} className="text-text-muted/40" />
                            </div>
                            <h2 className="text-xl font-bold text-text-primary mb-2">No bookmarks yet</h2>
                            <p className="text-text-muted max-w-sm mb-8">Organize your favorite tools, documents, and local files into categorized boards.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setIsCreatingCategory(true)} className="btn btn-ghost ring-1 ring-border">Create your first category</button>
                                <button onClick={() => setIsCreatingBookmark(true)} className="btn btn-primary">Add your first bookmark</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {(isCreatingCategory || editingCategory) && (
                <CategoryModal
                    category={editingCategory}
                    onSubmit={(data) => {
                        if (editingCategory) {
                            updateCategoryMutation.mutate({ id: editingCategory.id, category: data });
                        } else {
                            createCategoryMutation.mutate(data);
                        }
                    }}
                    onClose={() => { setIsCreatingCategory(false); setEditingCategory(null); }}
                    isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                />
            )}

            {(isCreatingBookmark || editingBookmark) && (
                <BookmarkModal
                    bookmark={editingBookmark}
                    categories={categories}
                    initialCategoryId={selectedCategoryId}
                    onSubmit={(data) => {
                        if (editingBookmark) {
                            updateBookmarkMutation.mutate({ id: editingBookmark.id, bookmark: data });
                        } else {
                            createBookmarkMutation.mutate(data);
                        }
                    }}
                    onClose={() => { setIsCreatingBookmark(false); setEditingBookmark(null); setSelectedCategoryId(null); }}
                    isLoading={createBookmarkMutation.isPending || updateBookmarkMutation.isPending}
                />
            )}
        </div>
    );
}

// ============ Sub-components/Modals ============

function CategoryModal({
    category,
    onSubmit,
    onClose,
    isLoading
}: {
    category: BookmarkCategory | null;
    onSubmit: (d: CreateBookmarkCategory) => void;
    onClose: () => void;
    isLoading: boolean
}) {
    const [name, setName] = useState(category?.name || '');
    const [color, setColor] = useState(category?.color || '#3B82F6');

    const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#6B7280'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-background-card border border-border rounded-xl shadow-elevated w-full max-w-md animate-scale-in">
                <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, color }); }}>
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-primary">
                            {category ? 'Edit Category' : 'New Category'}
                        </h3>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-background-hover rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Category Name</label>
                            <input
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Social, Documents, etc."
                                className="input"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Theme Color</label>
                            <div className="flex flex-wrap gap-2">
                                {colors.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all shadow-sm ${color === c ? 'border-white scale-110 shadow-md' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    >
                                        {color === c && <Check size={14} className="mx-auto text-white" />}
                                    </button>
                                ))}
                                <div className="relative flex items-center">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="w-8 h-8 rounded-full border-none p-0 bg-transparent cursor-pointer overflow-hidden transform scale-125"
                                    />
                                    <Palette size={14} className="absolute inset-0 m-auto pointer-events-none text-white mix-blend-difference" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-border flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost ring-1 ring-border">Cancel</button>
                        <button type="submit" disabled={isLoading} className="btn btn-primary min-w-[100px]">
                            {isLoading ? 'Saving...' : 'Save Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function BookmarkModal({
    bookmark,
    categories,
    initialCategoryId,
    onSubmit,
    onClose,
    isLoading
}: {
    bookmark: BookmarkType | null;
    categories: BookmarkCategory[];
    initialCategoryId: number | null;
    onSubmit: (d: CreateBookmark) => void;
    onClose: () => void;
    isLoading: boolean
}) {
    const [title, setTitle] = useState(bookmark?.title || '');
    const [url, setUrl] = useState(bookmark?.url || '');
    const [description, setDescription] = useState(bookmark?.description || '');
    const [categoryId, setCategoryId] = useState<number | undefined>(bookmark?.category_id || initialCategoryId || undefined);
    const [isFile, setIsFile] = useState(bookmark?.is_file || false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-background-card border border-border rounded-xl shadow-elevated w-full max-w-lg animate-scale-in">
                <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, url, description, category_id: categoryId, is_file: isFile }); }}>
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-primary">
                            {bookmark ? 'Edit Bookmark' : 'New Bookmark'}
                        </h3>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-background-hover rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex gap-2 p-1 bg-background rounded-lg border border-border">
                            <button
                                type="button"
                                onClick={() => setIsFile(false)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${!isFile ? 'bg-background-card text-accent-blue shadow-sm ring-1 ring-border' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                <Globe size={16} /> Web Link
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsFile(true)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${isFile ? 'bg-background-card text-accent-amber shadow-sm ring-1 ring-border' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                <FileText size={16} /> Local File
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Title</label>
                            <input
                                autoFocus
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={isFile ? "e.g., Q4 Expenses" : "e.g., Project Workspace"}
                                className="input"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <label className="text-sm font-medium text-text-secondary">{isFile ? "File Path" : "URL"}</label>
                                <input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder={isFile ? "C:\Users\Name\Desktop\report.xlsx" : "https://..."}
                                    className="input"
                                    required
                                />
                                {isFile && <p className="text-[10px] text-text-muted italic">Note: Provide the absolute path to your local file.</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Category</label>
                            <select
                                value={categoryId || ''}
                                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                                className="input bg-background cursor-pointer"
                            >
                                <option value="">Uncategorized</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add some notes about this bookmark..."
                                className="input min-h-[80px] py-3"
                            />
                        </div>
                    </div>
                    <div className="p-6 border-t border-border flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost ring-1 ring-border">Cancel</button>
                        <button type="submit" disabled={isLoading} className="btn btn-primary min-w-[100px]">
                            {isLoading ? 'Saving...' : 'Save Bookmark'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
