import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { CheckSquare, FileText, Code, Bookmark, Calendar } from 'lucide-react';

export interface MentionListProps {
    items: any[];
    command: (item: any) => void;
}

const typeIcons: any = {
    tasks: <CheckSquare size={14} className="text-accent-amber" />,
    notes: <FileText size={14} className="text-accent-blue" />,
    snippets: <Code size={14} className="text-accent-green" />,
    bookmarks: <Bookmark size={14} className="text-purple-400" />,
    daily_logs: <Calendar size={14} className="text-text-secondary" />,
};

const MentionList = forwardRef((props: MentionListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }

            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }

            if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
            }

            return false;
        },
    }));

    return (
        <div className="bg-background-card border border-border rounded-lg shadow-elevated overflow-hidden min-w-[250px] z-[1000]">
            {props.items.length > 0 ? (
                <div className="flex flex-col p-1 max-h-[300px] overflow-y-auto">
                    {props.items.map((item, index) => (
                        <button
                            key={`${item.itemType}-${item.id}`}
                            className={`flex items-center gap-3 px-3 py-2 text-sm text-left rounded-md transition-colors ${index === selectedIndex
                                ? 'bg-accent-blue/15 text-accent-blue font-medium'
                                : 'text-text-secondary hover:bg-background-hover hover:text-text-primary'
                                }`}
                            onClick={() => selectItem(index)}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                selectItem(index);
                            }}
                        >
                            <div className="flex-shrink-0">
                                {typeIcons[item.itemType] || <FileText size={14} />}
                            </div>
                            <div className="flex flex-col truncate">
                                <span className="truncate">{item.title}</span>
                                <span className="text-[10px] opacity-60 font-normal uppercase tracking-wider">{item.itemType.replace('_', ' ')}</span>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="px-3 py-2 text-sm text-text-muted">No items found</div>
            )}
        </div>
    );
});

MentionList.displayName = 'MentionList';

export default MentionList;
