import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import MentionList from './MentionList';
import { searchApi } from '../../../lib/api';

export default {
    items: async ({ query }: { query: string }) => {
        try {
            const data = await searchApi.getLinkableItems(query);

            // Flatten the categorized items into a single list
            const allItems: any[] = [
                ...data.tasks.map(item => ({ ...item, itemType: 'tasks' })),
                ...data.notes.map(item => ({ ...item, itemType: 'notes' })),
                ...data.snippets.map(item => ({ ...item, itemType: 'snippets' })),
                ...data.bookmarks.map(item => ({ ...item, itemType: 'bookmarks' })),
                ...data.daily_logs.map(item => ({ ...item, itemType: 'daily_logs' })),
            ];

            return allItems.slice(0, 10);
        } catch (error) {
            console.error('Failed to fetch linkable items:', error);
            return [];
        }
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
};
