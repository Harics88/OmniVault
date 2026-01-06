import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';

export default Extension.create({
    name: 'mentionCommand',

    addOptions() {
        return {
            suggestion: {
                char: '@',
                command: ({ editor, range, props }: any) => {
                    // Get the current origin (e.g., http://localhost:3001)
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';

                    // Map internal item types to their corresponding route paths
                    const pathMap: Record<string, string> = {
                        tasks: 'tasks',
                        notes: 'notes',
                        snippets: 'snippets',
                        bookmarks: 'bookmarks',
                        daily_logs: 'daily-log'
                    };

                    const itemPath = pathMap[props.itemType] || props.itemType;
                    const url = `${origin}/${itemPath}/${props.id}`;

                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .insertContent([
                            {
                                type: 'text',
                                text: props.title,
                                marks: [
                                    {
                                        type: 'link',
                                        attrs: {
                                            href: url,
                                            target: '_blank',
                                        },
                                    },
                                ],
                            },
                            {
                                type: 'text',
                                text: ' ',
                            },
                        ])
                        .run();
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
                pluginKey: new PluginKey('mentionCommand'),
            }),
        ];
    },
});
