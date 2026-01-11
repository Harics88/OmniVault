import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, FileText, Pin, Trash2 } from 'lucide-react';
import type { NoteTreeItem } from '../types';

interface NoteTreeProps {
    items: NoteTreeItem[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    onAddSubNote: (parentId: number) => void;
    onDelete: (id: number) => void;
    expandedIds: Set<number>;
    onToggleExpand: (id: number) => void;
}

interface TreeItemProps {
    item: NoteTreeItem;
    level: number;
    selectedId: number | null;
    onSelect: (id: number) => void;
    onAddSubNote: (parentId: number) => void;
    onDelete: (id: number) => void;
    expandedIds: Set<number>;
    onToggleExpand: (id: number) => void;
}

function TreeItem({
    item,
    level,
    selectedId,
    onSelect,
    onAddSubNote,
    onDelete,
    expandedIds,
    onToggleExpand,
}: TreeItemProps) {
    const [showActions, setShowActions] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.has(item.id);
    const isSelected = selectedId === item.id;

    return (
        <div className="select-none">
            {/* Tree Item Row */}
            <div
                className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${isSelected
                        ? 'bg-accent-blue/20 text-accent-blue'
                        : 'hover:bg-background-hover text-text-secondary'
                    }`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => onSelect(item.id)}
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
            >
                {/* Expand/Collapse Toggle */}
                <button
                    className={`p-0.5 rounded hover:bg-background-card transition-colors ${hasChildren ? 'visible' : 'invisible'
                        }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand(item.id);
                    }}
                >
                    {isExpanded ? (
                        <ChevronDown size={14} className="text-text-muted" />
                    ) : (
                        <ChevronRight size={14} className="text-text-muted" />
                    )}
                </button>

                {/* Icon */}
                <span className="text-base flex-shrink-0">{item.icon || '📄'}</span>

                {/* Title */}
                <span className="flex-1 truncate text-sm font-medium">
                    {item.title || 'Untitled'}
                </span>

                {/* Pin indicator */}
                {item.is_pinned && (
                    <Pin size={12} className="text-amber-500 flex-shrink-0" />
                )}

                {/* Hover Actions */}
                {showActions && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            className="p-1 hover:bg-background-card rounded transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddSubNote(item.id);
                            }}
                            title="Add sub-page"
                        >
                            <Plus size={14} className="text-text-muted" />
                        </button>
                        <button
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item.id);
                            }}
                            title="Delete"
                        >
                            <Trash2 size={14} className="text-text-muted hover:text-red-400" />
                        </button>
                    </div>
                )}
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {item.children.map((child) => (
                        <TreeItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onAddSubNote={onAddSubNote}
                            onDelete={onDelete}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function NoteTree({
    items,
    selectedId,
    onSelect,
    onAddSubNote,
    onDelete,
    expandedIds,
    onToggleExpand,
}: NoteTreeProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                <FileText size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No notes yet</p>
            </div>
        );
    }

    return (
        <div className="py-2">
            {items.map((item) => (
                <TreeItem
                    key={item.id}
                    item={item}
                    level={0}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onAddSubNote={onAddSubNote}
                    onDelete={onDelete}
                    expandedIds={expandedIds}
                    onToggleExpand={onToggleExpand}
                />
            ))}
        </div>
    );
}

export default NoteTree;
