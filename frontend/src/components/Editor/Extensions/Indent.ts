import { Extension } from '@tiptap/core';

export interface IndentOptions {
    types: string[];
    indentLevels: number[];
    defaultIndentLevel: number;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        indent: {
            /**
             * Set the indent attribute
             */
            indent: () => ReturnType;
            /**
             * Unset the indent attribute
             */
            outdent: () => ReturnType;
        };
    }
}

export const Indent = Extension.create<IndentOptions>({
    name: 'indent',

    addOptions() {
        return {
            types: ['paragraph', 'heading', 'blockquote'],
            indentLevels: [0, 32, 64, 96, 128, 160, 192, 224, 256],
            defaultIndentLevel: 0,
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    indent: {
                        default: this.options.defaultIndentLevel,
                        renderHTML: attributes => {
                            if (attributes.indent === 0) {
                                return {};
                            }

                            return {
                                style: `margin-left: ${attributes.indent}px!important;`,
                            };
                        },
                        parseHTML: element => parseInt(element.style.marginLeft, 10) || 0,
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            indent: () => ({ tr, state, dispatch }) => {
                const { selection } = state;
                tr = tr.setSelection(selection);
                const { from, to } = selection;

                state.doc.nodesBetween(from, to, (node, pos) => {
                    if (this.options.types.includes(node.type.name)) {
                        const currentIndent = node.attrs.indent || 0;
                        const nextIndentIndex = this.options.indentLevels.findIndex(level => level > currentIndent);
                        const nextIndent = nextIndentIndex !== -1 ? this.options.indentLevels[nextIndentIndex] : currentIndent;

                        if (nextIndent !== currentIndent) {
                            tr = tr.setNodeMarkup(pos, undefined, {
                                ...node.attrs,
                                indent: nextIndent,
                            });
                        }
                    }
                });

                if (dispatch) {
                    dispatch(tr);
                }

                return true;
            },
            outdent: () => ({ tr, state, dispatch }) => {
                const { selection } = state;
                tr = tr.setSelection(selection);
                const { from, to } = selection;

                state.doc.nodesBetween(from, to, (node, pos) => {
                    if (this.options.types.includes(node.type.name)) {
                        const currentIndent = node.attrs.indent || 0;
                        const prevIndentIndex = [...this.options.indentLevels].reverse().findIndex(level => level < currentIndent);
                        const prevIndent = prevIndentIndex !== -1 ? [...this.options.indentLevels].reverse()[prevIndentIndex] : 0;

                        if (prevIndent !== currentIndent) {
                            tr = tr.setNodeMarkup(pos, undefined, {
                                ...node.attrs,
                                indent: prevIndent,
                            });
                        }
                    }
                });

                if (dispatch) {
                    dispatch(tr);
                }

                return true;
            },
        };
    },
});
