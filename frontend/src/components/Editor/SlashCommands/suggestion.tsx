import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import {
    Heading1, Heading2, Heading3,
    List, ListOrdered, CheckSquare,
    Table, Code, Quote, Image as ImageIcon, Link as LinkIcon
} from 'lucide-react';
import React from 'react';
import CommandList from './CommandList';

export default {
    items: ({ query }: { query: string }) => {
        return [
            {
                title: 'Heading 1',
                description: 'Big section heading',
                icon: <Heading1 size={16} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
                },
            },
            {
                title: 'Heading 2',
                description: 'Medium section heading',
                icon: <Heading2 size={16} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
                },
            },
            {
                title: 'Heading 3',
                description: 'Small section heading',
                icon: <Heading3 size={16} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
                },
            },
            {
                title: 'Bullet List',
                description: 'Create a simple bullet list',
                icon: <List size={16} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleBulletList().run();
                },
            },
            {
                title: 'Numbered List',
                description: 'Create a list with numbering',
                icon: <ListOrdered size={16} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
                },
            },
            {
                title: 'Checklist',
                description: 'Track tasks with checkboxes',
                icon: <CheckSquare size={16} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleTaskList().run();
                },
            },
            {
                title: 'Code Block',
                description: 'Insert code with syntax highlighting',
                icon: <Code size={16} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setCodeBlock().run();
                },
            },
            {
                title: 'Table',
                description: 'Insert a 3x3 table',
                icon: <Table size={16} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                },
            },
            {
                title: 'Quote',
                description: 'Insert a blockquote',
                icon: <Quote size={16} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleBlockquote().run();
                },
            },
            {
                title: 'Image',
                description: 'Insert an image from URL',
                icon: <ImageIcon size={16} />,
                command: ({ editor, range }: any) => {
                    const url = window.prompt('Enter image URL:');
                    if (url) {
                        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
                    }
                },
            },
            {
                title: 'Hyperlink',
                description: 'Add a web link',
                icon: <LinkIcon size={16} />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).run();
                    // Trigger the link modal by calling the setEditing function
                    // This will be passed from the RichTextEditor component
                    if ((window as any).openLinkModal) {
                        (window as any).openLinkModal();
                    }
                },
            },
        ].filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        );
    },

    render: () => {
        let component: any;
        let popup: any;

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(CommandList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                    return;
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }

                return component.ref?.onKeyDown(props);
            },

            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
};
