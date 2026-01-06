import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
    FileText,
    List, ListOrdered, CheckSquare,
    Table, Code, Quote, Image as ImageIcon,
    Type
} from 'lucide-react';

export interface CommandListProps {
    items: any[];
    command: (item: any) => void;
}

const CommandList = forwardRef((props: CommandListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items.length]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (props.items.length === 0) return false;

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
        <div className="bg-background-card border border-border rounded-lg shadow-elevated overflow-hidden min-w-[220px] z-[1000] flex flex-col max-h-[400px]">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                {props.items.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                        {props.items.map((item, index) => (
                            <button
                                key={index}
                                className={`flex items-center gap-3 px-3 py-2 text-sm text-left rounded-md transition-all duration-200 ${index === selectedIndex
                                    ? 'bg-accent-blue/15 text-accent-blue shadow-sm ring-1 ring-accent-blue/20'
                                    : 'text-text-secondary hover:bg-background-hover hover:text-text-primary'
                                    }`}
                                onClick={() => selectItem(index)}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectItem(index);
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${index === selectedIndex
                                    ? 'bg-accent-blue/20 text-accent-blue'
                                    : 'bg-background border border-border'
                                    }`}>
                                    {item.icon || <Type size={16} />}
                                </div>
                                <div className="flex flex-col flex-1 truncate">
                                    <span className="font-medium">{item.title}</span>
                                    {item.description && (
                                        <span className="text-[10px] opacity-60 font-normal truncate">{item.description}</span>
                                    )}
                                </div>
                                {index === selectedIndex && (
                                    <span className="text-[10px] text-accent-blue opacity-50 px-1 py-0.5 rounded border border-accent-blue/20 font-mono">
                                        Enter
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="px-3 py-4 text-center text-sm text-text-muted italic">
                        No commands found
                    </div>
                )}
            </div>
            <div className="p-2 bg-background/30 border-t border-border flex justify-between items-center text-[10px] text-text-muted">
                <span>Navigate with arrows</span>
                <span className="px-1 py-0.5 bg-background border border-border rounded font-mono">/</span>
            </div>
        </div>
    );
});

CommandList.displayName = 'CommandList';

export default CommandList;
