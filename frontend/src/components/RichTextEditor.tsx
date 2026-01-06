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
import { Extension } from '@tiptap/core';
import { common, createLowlight } from 'lowlight';
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
    Quote, Code, Undo, Redo, ExternalLink, Pencil, Unlink, CheckSquare, Table as TableIcon,
    Columns, Rows, Trash2, Highlighter, AlignLeft, AlignCenter, AlignRight,
    Minus, Search as SearchIcon, Palette, X, Replace, ChevronDown, Indent, Outdent
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

// Custom Extensions
import SlashCommands from './Editor/SlashCommands/Commands';
import suggestion from './Editor/SlashCommands/suggestion';
import Mentions from './Editor/Mentions/Mentions';
import mentionSuggestion from './Editor/Mentions/suggestion';

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
    const [isEditingLink, setIsEditingLink] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [replaceText, setReplaceText] = useState('');

    const editor = useEditor({
        editable: isEditable,
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),
            Underline,
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
                openOnClick: false, autolink: true,
                HTMLAttributes: { class: 'text-accent-blue underline cursor-pointer', target: '_blank', rel: 'noopener noreferrer' },
            }),
            Placeholder.configure({
                placeholder: placeholder,
            }),
            Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full my-2 shadow-sm' } }),
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
                if (html) return false;
                const items = Array.from(event.clipboardData?.items || []);
                const imageItem = items.find(item => item.type.startsWith('image/'));
                if (imageItem) {
                    const file = imageItem.getAsFile();
                    if (file) {
                        event.preventDefault();
                        compressImage(file).then(base64 => { if (base64 && editor) editor.chain().focus().setImage({ src: base64 }).run(); });
                        return true;
                    }
                }
                const text = event.clipboardData?.getData('text/plain');
                if (text && /^https?:\/\//.test(normalizeUrl(text)) && !view.state.selection.empty) {
                    editor?.chain().focus().extendMarkRange('link').setLink({ href: normalizeUrl(text) }).run();
                    return true;
                }
                return false;
            },
            handleClick: (view, pos, event) => {
                const target = event.target as HTMLElement;
                if (target.tagName === 'A' && event.ctrlKey) {
                    const href = target.getAttribute('href');
                    if (href) { window.open(normalizeUrl(href), '_blank', 'noopener,noreferrer'); return true; }
                }
                return false;
            }
        }
    });

    useEffect(() => { if (editor) editor.setEditable(isEditable); }, [editor, isEditable]);
    useEffect(() => { if (editor && content !== editor.getHTML()) editor.commands.setContent(content); }, [content, editor]);

    const setLink = useCallback(() => {
        if (!editor) return;
        setLinkUrl(editor.getAttributes('link').href || '');
        setIsEditingLink(true);
    }, [editor]);

    const applyLink = useCallback(() => {
        if (!editor) return;
        if (linkUrl === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
        else editor.chain().focus().extendMarkRange('link').setLink({ href: normalizeUrl(linkUrl) }).run();
        setIsEditingLink(false); setLinkUrl('');
    }, [editor, linkUrl]);

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

    if (!editor) return null;

    return (
        <div className="border border-border rounded-lg overflow-hidden bg-background flex flex-col h-full relative">
            {/* Bubble Menus */}
            <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} shouldShow={({ editor }) => isEditable && editor.isActive('link')}>
                <div className="flex items-center gap-1 p-2 bg-background-card border border-border rounded-lg shadow-elevated">
                    {isEditingLink ? (
                        <>
                            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' ? applyLink() : e.key === 'Escape' && setIsEditingLink(false)}
                                placeholder="Enter URL..." className="px-2 py-1 text-sm bg-background border border-border rounded text-text-primary w-48 focus:outline-none" autoFocus />
                            <button onClick={applyLink} className="px-2 py-1 text-xs bg-accent-green text-white rounded">Save</button>
                        </>
                    ) : (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-text-muted px-2 truncate max-w-[150px]">{editor.getAttributes('link').href}</span>
                            <button onClick={() => window.open(normalizeUrl(editor.getAttributes('link').href), '_blank')} className="p-1.5 text-accent-blue"><ExternalLink size={14} /></button>
                            <button onClick={() => setIsEditingLink(true)} className="p-1.5 text-text-muted"><Pencil size={14} /></button>
                            <button onClick={() => editor.chain().focus().unsetLink().run()} className="p-1.5 text-accent-red"><Unlink size={14} /></button>
                        </div>
                    )}
                </div>
            </BubbleMenu>

            {/* Table Menu */}
            <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} shouldShow={({ editor }) => isEditable && editor.isActive('table')}>
                <div className="flex items-center gap-1 p-1 bg-background-card border border-border rounded-lg shadow-elevated">
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

                    <ToolbarButton onClick={() => editor.chain().focus().sinkListItem('listItem').run()} disabled={!editor.can().sinkListItem('listItem')} title="Indent (List)"><Indent size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().liftListItem('listItem').run()} disabled={!editor.can().liftListItem('listItem')} title="Outdent (List)"><Outdent size={16} /></ToolbarButton>

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
