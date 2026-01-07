import React, { useState } from 'react';
import { MoreVertical, Plus, Trash2, Edit2, Globe } from 'lucide-react';
import type { Bookmark, BookmarkCategory } from '../types';
import { getFileIcon } from '../utils/fileIcons';

interface BookmarkCategoryCardProps {
    category: BookmarkCategory;
    bookmarks: Bookmark[];
    onAddBookmark: (categoryId: number) => void;
    onDeleteCategory: (id: number) => void;
    onEditCategory: (category: BookmarkCategory) => void;
    onDeleteBookmark: (id: number) => void;
    onEditBookmark: (bookmark: Bookmark) => void;
    onOpenBookmark: (bookmark: Bookmark) => void;
}

export default function BookmarkCategoryCard({
    category,
    bookmarks,
    onAddBookmark,
    onDeleteCategory,
    onEditCategory,
    onDeleteBookmark,
    onEditBookmark,
    onOpenBookmark
}: BookmarkCategoryCardProps) {
    const [showOptions, setShowOptions] = useState(false);

    return (
        <div className="flex flex-col bg-background-card border-t-4 rounded-lg shadow-sm h-fit min-w-[280px]" style={{ borderTopColor: category.color }}>
            <div className="p-3 flex items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">{category.name}</h3>
                    <span className="text-xs text-text-muted bg-background px-1.5 py-0.5 rounded-full">{bookmarks.length}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onAddBookmark(category.id)}
                        className="p-1 hover:bg-background-hover rounded text-text-muted hover:text-accent-blue transition-colors"
                        title="Add Bookmark"
                    >
                        <Plus size={16} />
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="p-1 hover:bg-background-hover rounded text-text-muted hover:text-text-primary transition-colors"
                        >
                            <MoreVertical size={16} />
                        </button>
                        {showOptions && (
                            <div className="absolute right-0 mt-1 w-40 bg-background-card border border-border rounded-lg shadow-elevated z-10 py-1">
                                <button
                                    onClick={() => { onEditCategory(category); setShowOptions(false); }}
                                    className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-background-hover"
                                >
                                    <Edit2 size={12} /> Edit Category
                                </button>
                                <button
                                    onClick={() => { onDeleteCategory(category.id); setShowOptions(false); }}
                                    className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-accent-red/10 text-accent-red hover:bg-accent-red/20"
                                >
                                    <Trash2 size={12} /> Delete Category
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 p-1 max-h-[500px] overflow-y-auto">
                <div className="space-y-0.5">
                    {bookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="group relative flex items-center gap-2 px-2 py-1.5 hover:bg-background-hover rounded-md transition-colors cursor-pointer" onClick={() => onOpenBookmark(bookmark)}>
                            <div className="flex-shrink-0">
                                {bookmark.is_file ? (() => {
                                    const { icon: Icon, color } = getFileIcon(bookmark.url);
                                    return <Icon size={14} className={color} />;
                                })() : (
                                    <Globe size={14} className="text-accent-blue" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-text-primary font-medium truncate group-hover:text-accent-blue">
                                    {bookmark.title}
                                </div>
                            </div>
                            <div className="hidden group-hover:flex items-center gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEditBookmark(bookmark); }}
                                    className="p-1 hover:text-accent-blue text-text-muted"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteBookmark(bookmark.id); }}
                                    className="p-1 hover:text-accent-red text-text-muted"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {bookmarks.length === 0 && (
                        <div className="py-8 text-center text-text-muted text-xs italic">
                            No bookmarks in this category
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
