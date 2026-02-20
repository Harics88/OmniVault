import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Mention from '@tiptap/extension-mention';
import React, { useEffect } from 'react';
import type { Entity } from '../types';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import MentionList from './Editor/Mentions/MentionList';
import { wrappingInputRule, Extension } from '@tiptap/core';

interface LiteEditorProps {
    content: string;
    onChange: (content: string) => void;
    onEnter?: () => void;
    placeholder?: string;
    entities: Entity[];
}

export const LiteEditor: React.FC<LiteEditorProps> = ({
    content,
    onChange,
    onEnter,
    placeholder = 'Type something...',
    entities
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                codeBlock: false,
                blockquote: false,
            }),
            Underline,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            Placeholder.configure({
                placeholder,
            }),
            Mention.configure({
                // ... same mention config ...
                HTMLAttributes: {
                    class: 'mention',
                },
                renderHTML({ node }) {
                    return [
                        'span',
                        {
                            class: 'mention outline-none',
                            'data-id': node.attrs.id,
                            'data-label': node.attrs.label,
                        },
                        `@${node.attrs.label ?? node.attrs.id}`,
                    ]
                },
                suggestion: {
                    items: ({ query }) => {
                        return entities
                            .filter(item =>
                                item.name.toLowerCase().includes(query.toLowerCase())
                            )
                            .map(item => ({
                                id: item.id,
                                title: item.name,
                                label: item.name,
                                itemType: item.type,
                            }))
                            .slice(0, 10);
                    },
                    render: () => {
                        let component: any;
                        let popup: any;

                        return {
                            onStart: (props: any) => {
                                component = new ReactRenderer(MentionList, {
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
                },
            }),
            Extension.create({
                name: 'taskListInputRules',
                addInputRules() {
                    return [
                        wrappingInputRule({
                            find: /^^\s*(\[ \])\s$/,
                            type: this.editor.schema.nodes.taskItem,
                            getAttributes: () => ({
                                checked: false,
                            }),
                        }),
                        wrappingInputRule({
                            find: /^^\s*(\[x\])\s$/,
                            type: this.editor.schema.nodes.taskItem,
                            getAttributes: () => ({
                                checked: true,
                            }),
                        }),
                    ];
                },
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[80px] p-0 text-[#E6EDF3]',
            },
            handleKeyDown: (_, event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                    // If mention suggestion is active, let it handle the enter key
                    const isMentionOpen = document.querySelector('.tippy-box');
                    if (isMentionOpen) return false;

                    onEnter?.();
                    return true;
                }
                return false;
            },
        },
    });

    // Handle clearing content from outside
    useEffect(() => {
        if (editor && content === '' && editor.getHTML() !== '<p></p>') {
            editor.commands.clearContent();
        }
    }, [content, editor]);

    // Handle initial content sync if it changes while NOT editing
    useEffect(() => {
        if (editor && content && content !== editor.getHTML() && !editor.isFocused) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    return (
        <div className="lite-editor min-h-[80px]">
            <style>{`
                .mention {
                    background-color: rgba(163, 113, 247, 0.2);
                    color: #A371F7;
                    border-radius: 0.4rem;
                    padding: 0.1rem 0.3rem;
                    box-decoration-break: clone;
                    font-weight: 500;
                }
            `}</style>
            <EditorContent editor={editor} />
        </div>
    );
};
