import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Typography from '@tiptap/extension-typography';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Focus from '@tiptap/extension-focus';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { Extension, wrappingInputRule } from '@tiptap/core';
import { common, createLowlight } from 'lowlight';
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
    Quote, Code, Undo, Redo, CheckSquare, Table as TableIcon,
    Columns, Rows, Trash2, Highlighter, AlignLeft, AlignCenter, AlignRight,
    Minus, Search as SearchIcon, Palette, X, Replace, ChevronDown, Indent, Outdent,
    Unlink
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import LinkModal from './LinkModal';

// Custom Extensions
import SlashCommands from './Editor/SlashCommands/Commands';
import suggestion from './Editor/SlashCommands/suggestion';
import Mentions from './Editor/Mentions/Mentions';
import mentionSuggestion from './Editor/Mentions/suggestion';
import { Indent as IndentExtension } from './Editor/Extensions/Indent';

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// Custom BlockId extension for unique IDs
const BlockId = Extension.create({
    name: 'blockId',
    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading', 'blockquote', 'codeBlock', 'bulletList', 'orderedList'],
                attributes: {
                    id: {
                        default: null,
                        renderHTML: attributes => ({
                            'data-id': attributes.id || Math.random().toString(36).substring(2, 9),
                        }),
                        parseHTML: element => element.getAttribute('data-id'),
                    },
                },
            },
        ];
    },
});

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    isEditable?: boolean;
}

// Helper function to ensure URL has protocol
function normalizeUrl(url: string): string {
    if (!url) return url;
    url = url.trim();
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
        return `https://${url}`;
    }
    return url;
}

// Helper to compress image
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.6)); }
                else { resolve(event.target?.result as string); }
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

export default function RichTextEditor({ content, onChange, placeholder = 'Add a description...', isEditable = true }: RichTextEditorProps) {
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkText, setLinkText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [replaceText, setReplaceText] = useState('');

    const editor = useEditor({
        editable: isEditable,
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),
            Underline,
            IndentExtension,
            TaskList,
            TaskItem.configure({ nested: true }),
            CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'plaintext' }),
            Typography,
            Table.configure({ resizable: true }),
            TableRow, TableHeader, TableCell,
            Highlight.configure({ multicolor: true }),
            TextStyle, Color,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Focus.configure({ className: 'has-focus', mode: 'all' }),
            BlockId,
            SlashCommands.configure({ suggestion }),
            Mentions.configure({ suggestion: mentionSuggestion }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                linkOnPaste: false, // We handle paste manually
                HTMLAttributes: { class: 'text-accent-blue underline cursor-pointer', target: '_blank', rel: 'noopener noreferrer' },
            }),
            Placeholder.configure({
                placeholder: placeholder,
            }),
            Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full my-2 shadow-sm' } }),
            BubbleMenuExtension.configure({
                pluginKey: 'bubbleMenuPlugin',
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
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[500px] h-full p-4',
            },
            handlePaste: (view, event) => {
                const html = event.clipboardData?.getData('text/html');
                const text = event.clipboardData?.getData('text/plain');

                // If it's an image, handle it
                const items = Array.from(event.clipboardData?.items || []);
                for (const item of items) {
                    if (item.type.indexOf('image') === 0) {
                        event.preventDefault();
                        const file = item.getAsFile();
                        if (file) {
                            compressImage(file).then(compressedDataUrl => {
                                view.dispatch(view.state.tr.replaceSelectionWith(
                                    view.state.schema.nodes.image.create({ src: compressedDataUrl })
                                ));
                            });
                        }
                        return true;
                    }
                }

                // Smart Paste: Preserve links from HTML (e.g. Outlook/Notes)
                if (html) {
                    // Check if the HTML contains a link structure we want to preserve
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const links = doc.getElementsByTagName('a');

                    // If content is just a single link (or wrapped in simple containers)
                    if (links.length === 1 && doc.body.textContent?.trim().length === links[0].textContent?.trim().length) {
                        const href = links[0].getAttribute('href');
                        const linkText = links[0].textContent;

                        if (href && linkText) {
                            // Manually insert the link to ensure it's preserved
                            editor?.chain().focus().insertContent(`<a href="${href}">${linkText}</a> `).run();
                            return true; // Prevent default paste
                        }
                    }

                    // Otherwise let Tiptap handle generic HTML
                    return false;
                }

                // Handle plain text URLs
                const looksLikeUrl = (str: string) => {
                    if (!str || str.includes(' ')) return false;
                    // Strict URL check
                    try {
                        const normalizedStr = !/^https?:\/\//i.test(str) && !/^mailto:/i.test(str) ? `https://${str}` : str;
                        const url = new URL(normalizedStr);
                        // Require at least one dot in the hostname (e.g. example.com)
                        return url.hostname.includes('.') && url.hostname.length > 3;
                    } catch {
                        return false;
                    }
                };

                if (text && looksLikeUrl(text.trim())) {
                    const normalized = normalizeUrl(text.trim());
                    if (view.state.selection.empty) {
                        // Extract a "title" from the URL if possible (domain name)
                        let title = text.trim();
                        try {
                            const urlObj = new URL(normalized);
                            title = urlObj.hostname.replace('www.', '');
                        } catch (e) {
                            title = text.trim();
                        }

                        editor?.chain().focus().insertContent(`<a href="${normalized}">${title}</a> `).run();
                    } else {
                        editor?.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run();
                    }
                    return true;
                }
                return false;
            },
            handleClick: (view, _pos, event) => {
                const target = event.target as HTMLElement;
                const link = target.closest('a');
                if (link) {
                    const href = link.getAttribute('href');
                    const isCtrlOrMeta = event.ctrlKey || event.metaKey;

                    // Open links on click if not in editable mode, OR if Ctrl/Cmd is held
                    // editor instance from useEditor might not be available here yet, so we use view
                    // Check if view itself is editable (prop is usually a function or boolean)
                    const isEditableView = !!view.props.editable;
                    if (href && (!isEditableView || isCtrlOrMeta)) {
                        event.preventDefault();
                        window.open(normalizeUrl(href), '_blank', 'noopener,noreferrer');
                        return true;
                    }
                }
                return false;
            }
        },
        onSelectionUpdate: ({ editor }) => {
            // If selection changes and we're not editing a link, reset URL/Text states
            if (!editor.isActive('link') && !showLinkModal) {
                setLinkUrl('');
                setLinkText('');
            }
        }
    });


    const setLink = useCallback(() => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');

        // Set initial values and show modal
        setLinkText(selectedText);
        setLinkUrl(editor.getAttributes('link').href || '');
        setShowLinkModal(true);
    }, [editor]);

    const handleLinkSubmit = useCallback((url: string, text: string) => {
        if (!editor) return;

        // Normalize the URL
        const normalizedUrl = !/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)
            ? `https://${url}`
            : url;

        const finalText = text || url;
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');

        if (selectedText) {
            // Replace selected text with link
            editor.chain().focus().insertContent({
                type: 'text',
                text: finalText,
                marks: [{ type: 'link', attrs: { href: normalizedUrl } }]
            }).run();
        } else {
            // No selection - insert the link
            editor.chain().focus().insertContent([
                {
                    type: 'text',
                    text: finalText,
                    marks: [{ type: 'link', attrs: { href: normalizedUrl } }]
                },
                { type: 'text', text: ' ' }
            ]).run();
        }
    }, [editor]);


    const addImage = useCallback(() => {
        if (!editor) return;
        const url = window.prompt('Enter image URL:');
        if (url) editor.chain().focus().setImage({ src: normalizeUrl(url) }).run();
    }, [editor]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editor || !searchQuery) return;
        // Simple search: for now we use the highlight extension if we had a dedicated one, 
        // but without Pro Search, we'll just show it's "coming soon" or use a browser finder.
        // Actually, let's just use the highlight extension to mark things for now.
        editor.chain().focus().selectAll().unsetHighlight().run();
        // Browser search is more reliable for viewing
        (window as any).find(searchQuery, false, false, true, false, true, false);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k' && editor?.isFocused) {
                e.preventDefault();
                setLink();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editor, setLink]);

    useEffect(() => { if (editor) editor.setEditable(isEditable); }, [editor, isEditable]);
    useEffect(() => { if (editor && content !== editor.getHTML()) editor.commands.setContent(content); }, [content, editor]);

    // Expose openLinkModal globally for slash command
    useEffect(() => {
        (window as any).openLinkModal = () => setLink();
        return () => {
            delete (window as any).openLinkModal;
        };
    }, [setLink]);

    if (!editor) return null;

    return (
        <div className="border border-border rounded-lg overflow-hidden bg-background flex flex-col h-full relative">

            {/* Table Menu */}
            <BubbleMenu
                pluginKey="tableBubbleMenu"
                editor={editor}
                tippyOptions={{ duration: 150, appendTo: () => document.body }}
                shouldShow={({ editor }) => isEditable && editor.isActive('table')}
            >
                <div className="flex items-center gap-1 p-1 bg-background-card border border-accent-blue/30 rounded-lg shadow-elevated z-50">
                    <ToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Column Before"><Columns size={14} className="rotate-180" /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After"><Columns size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column"><Trash2 size={14} className="text-accent-red" /></ToolbarButton>
                    <div className="w-px h-4 bg-border mx-1" />
                    <ToolbarButton onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Before"><Rows size={14} className="rotate-180" /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After"><Rows size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row"><Trash2 size={14} className="text-accent-red" /></ToolbarButton>
                    <div className="w-px h-4 bg-border mx-1" />
                    <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table"><Trash2 size={16} className="text-accent-red" /></ToolbarButton>
                </div>
            </BubbleMenu>

            {/* Text Selection Bubble Menu */}
            <BubbleMenu
                pluginKey="textBubbleMenu"
                editor={editor}
                tippyOptions={{ duration: 150, appendTo: () => document.body }}
                shouldShow={({ editor, from, to }) => {
                    // Only show if editable, selection is not empty, and not inside a table or code block
                    return isEditable && !editor.isActive('table') && !editor.isActive('codeBlock') && from !== to;
                }}
            >
                <div className="flex items-center gap-0.5 p-1 bg-background-card border border-accent-blue/30 rounded-lg shadow-elevated overflow-hidden z-50">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline"><UnderlineIcon size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Code"><Code size={14} /></ToolbarButton>
                    <div className="w-px h-4 bg-border mx-1" />
                    <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight"><Highlighter size={14} /></ToolbarButton>
                    <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Link"><LinkIcon size={14} /></ToolbarButton>
                    <div className="w-px h-4 bg-border mx-1" />
                    <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Clear Formatting"><X size={14} /></ToolbarButton>
                </div>
            </BubbleMenu>

            {/* Toolbar */}
            {isEditable && (
                <div className="flex items-center gap-1 p-2 border-b border-border bg-background-card flex-wrap sticky top-0 z-10">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline"><UnderlineIcon size={16} /></ToolbarButton>
                    <div className="relative flex items-center group">
                        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight">
                            <div className="flex items-center gap-0.5">
                                <Highlighter size={16} />
                                <ChevronDown size={10} className="opacity-50" />
                            </div>
                        </ToolbarButton>
                        <div className="absolute top-full left-0 mt-1 p-1 bg-background-elevated border border-border rounded-lg shadow-xl flex gap-1 invisible group-hover:visible z-50">
                            {/* Standard Colors */}
                            {[
                                { color: '#ffc078', label: 'Orange' },
                                { color: '#8ce99a', label: 'Green' },
                                { color: '#74c0fc', label: 'Blue' },
                                { color: '#faa2c1', label: 'Pink' },
                                { color: '#b197fc', label: 'Purple' },
                            ].map((c) => (
                                <button
                                    key={c.color}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        editor.chain().focus().toggleHighlight({ color: c.color }).run();
                                    }}
                                    className="w-5 h-5 rounded hover:scale-110 transition-transform border border-border"
                                    style={{ backgroundColor: c.color }}
                                    title={c.label}
                                />
                            ))}
                            <button
                                onClick={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); }}
                                className="w-5 h-5 rounded hover:scale-110 transition-transform border border-border bg-transparent flex items-center justify-center text-text-muted"
                                title="Clear Highlight"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="relative flex items-center group">
                        <ToolbarButton onClick={() => { }} title="Text Color">
                            <div className="flex items-center gap-0.5">
                                <Palette size={16} />
                                <ChevronDown size={10} className="opacity-50" />
                            </div>
                        </ToolbarButton>
                        <div className="absolute top-full left-0 mt-1 p-1 bg-background-elevated border border-border rounded-lg shadow-xl flex gap-1 invisible group-hover:visible z-50 w-[140px] flex-wrap justify-start content-start">
                            {[
                                { color: '#ff6b6b', label: 'Red' },
                                { color: '#ffa94d', label: 'Orange' },
                                { color: '#fcc419', label: 'Yellow' },
                                { color: '#51cf66', label: 'Green' },
                                { color: '#339af0', label: 'Blue' },
                                { color: '#5c7cfa', label: 'Indigo' },
                                { color: '#cc5de8', label: 'Purple' },
                                { color: '#f06595', label: 'Pink' },
                            ].map((c) => (
                                <button
                                    key={c.color}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        editor.chain().focus().setColor(c.color).run();
                                    }}
                                    className="w-5 h-5 rounded hover:scale-110 transition-transform border border-border"
                                    style={{ backgroundColor: c.color }}
                                    title={c.label}
                                />
                            ))}
                            <button
                                onClick={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }}
                                className="w-5 h-5 rounded hover:scale-110 transition-transform border border-border bg-transparent flex items-center justify-center text-text-muted"
                                title="Reset Color"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="w-px h-5 bg-border mx-1" />

                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={16} /></ToolbarButton>

                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={16} /></ToolbarButton>

                    <div className="w-px h-5 bg-border mx-1" />

                    <ToolbarButton
                        onClick={() => {
                            if (editor.can().sinkListItem('listItem')) {
                                editor.chain().focus().sinkListItem('listItem').run();
                            } else {
                                (editor.commands as any).indent();
                            }
                        }}
                        title="Indent"
                    >
                        <Indent size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => {
                            if (editor.can().liftListItem('listItem')) {
                                editor.chain().focus().liftListItem('listItem').run();
                            } else {
                                (editor.commands as any).outdent();
                            }
                        }}
                        title="Outdent"
                    >
                        <Outdent size={16} />
                    </ToolbarButton>

                    <div className="w-px h-5 bg-border mx-1" />

                    <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List"><List size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Checklist"><CheckSquare size={16} /></ToolbarButton>

                    <div className="w-px h-5 bg-border mx-1" />

                    <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote"><Quote size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block"><Code size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus size={16} /></ToolbarButton>

                    <div className="w-px h-5 bg-border mx-1" />

                    <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Link"><LinkIcon size={16} /></ToolbarButton>
                    {editor.isActive('link') && (
                        <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link">
                            <Unlink size={16} className="text-accent-red" />
                        </ToolbarButton>
                    )}
                    <ToolbarButton onClick={addImage} title="Image"><ImageIcon size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()} title="Table"><TableIcon size={16} /></ToolbarButton>

                    <div className="w-px h-5 bg-border mx-1" />

                    <ToolbarButton onClick={() => setShowSearch(!showSearch)} isActive={showSearch} title="Search"><SearchIcon size={16} /></ToolbarButton>
                    <div className="flex-1" />
                    <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={16} /></ToolbarButton>
                </div>
            )}

            {/* Search Bar */}
            {showSearch && (
                <div className="flex items-center gap-2 p-2 bg-background-card border-b border-border animate-fade-in">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
                        <SearchIcon size={14} className="text-text-muted" />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search in note..." className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary" autoFocus />
                        <button type="submit" className="text-xs text-accent-blue hover:underline">Find Next</button>
                    </form>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-1">
                        <input value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Replace with..." className="bg-transparent border-none outline-none text-sm text-text-primary w-32" />
                        <button onClick={() => { /* Simple HTML replace is risky, so we'll just focus the found text */ }} className="p-1 hover:bg-background-hover rounded"><Replace size={14} /></button>
                    </div>
                    <button onClick={() => setShowSearch(false)} className="p-1 hover:bg-background-hover rounded"><X size={14} /></button>
                </div>
            )}

            <EditorContent editor={editor} className="flex-1 overflow-y-auto min-h-0 bg-background" />

            {/* Link Modal */}
            <LinkModal
                isOpen={showLinkModal}
                onClose={() => setShowLinkModal(false)}
                onSubmit={handleLinkSubmit}
                onRemove={() => editor?.chain().focus().unsetLink().run()}
                initialText={linkText}
                initialUrl={linkUrl}
            />
        </div>
    );
}

function ToolbarButton({ onClick, isActive = false, disabled = false, title, children }: { onClick: () => void, isActive?: boolean, disabled?: boolean, title: string, children: React.ReactNode }) {
    return (
        <button
            onClick={e => { e.preventDefault(); onClick(); }}
            disabled={disabled}
            title={title}
            className={`p-2 rounded transition-colors ${isActive ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-muted hover:bg-background-hover hover:text-text-primary'} ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {children}
        </button>
    );
}
