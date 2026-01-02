import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Link as LinkIcon,
    Image as ImageIcon,
    Quote,
    Code,
    Undo,
    Redo,
    ExternalLink,
    Pencil,
    Unlink
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

// Helper function to ensure URL has protocol
function normalizeUrl(url: string): string {
    if (!url) return url;
    url = url.trim();
    // If URL doesn't start with a protocol, add https://
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
        return `https://${url}`;
    }
    return url;
}

export default function RichTextEditor({ content, onChange, placeholder = 'Add a description...' }: RichTextEditorProps) {
    const [isEditingLink, setIsEditingLink] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            Link.configure({
                openOnClick: false, // We'll handle this ourselves
                autolink: true,
                HTMLAttributes: {
                    class: 'text-accent-blue underline cursor-pointer',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full rounded-lg my-2',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[120px] p-3',
            },
            handleClick: (view, pos, event) => {
                // Handle link clicks
                const target = event.target as HTMLElement;
                if (target.tagName === 'A') {
                    const href = target.getAttribute('href');
                    if (href && event.ctrlKey) {
                        // Ctrl+Click to open link
                        const normalizedUrl = normalizeUrl(href);
                        window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
                        return true;
                    }
                }
                return false;
            },
            handlePaste: (view, event) => {
                const items = Array.from(event.clipboardData?.items || []);

                for (const item of items as any[]) {
                    if (item.type.indexOf('image') === 0) {
                        event.preventDefault(); // Prevent default paste behavior
                        const file = item.getAsFile();
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const base64 = e.target?.result as string;
                                if (base64 && editor) {
                                    editor.chain().focus().setImage({ src: base64 }).run();
                                }
                            };
                            reader.readAsDataURL(file);
                            return true;
                        }
                    }
                }

                const { state } = view;
                const { selection } = state;
                const text = event.clipboardData?.getData('text/plain');

                if (text && /^https?:\/\//.test(normalizeUrl(text)) && !selection.empty) {
                    editor?.chain().focus().extendMarkRange('link').setLink({ href: normalizeUrl(text) }).run();
                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Update content when it changes externally
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes('link').href || '';
        setLinkUrl(previousUrl);
        setIsEditingLink(true);
    }, [editor]);

    const applyLink = useCallback(() => {
        if (!editor) return;

        if (linkUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            const normalizedUrl = normalizeUrl(linkUrl);
            editor.chain().focus().extendMarkRange('link').setLink({ href: normalizedUrl }).run();
        }
        setIsEditingLink(false);
        setLinkUrl('');
    }, [editor, linkUrl]);

    const removeLink = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        setIsEditingLink(false);
        setLinkUrl('');
    }, [editor]);

    const openLink = useCallback(() => {
        if (!editor) return;
        const href = editor.getAttributes('link').href;
        if (href) {
            const normalizedUrl = normalizeUrl(href);
            window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
        }
    }, [editor]);

    const addImage = useCallback(() => {
        if (!editor) return;

        const url = window.prompt('Enter image URL:');
        if (url) {
            const normalizedUrl = normalizeUrl(url);
            editor.chain().focus().setImage({ src: normalizedUrl }).run();
        }
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="border border-border rounded-lg overflow-hidden bg-background">
            {/* Bubble Menu for Links */}
            <BubbleMenu
                editor={editor}
                tippyOptions={{ duration: 100 }}
                shouldShow={({ editor }) => editor.isActive('link')}
            >
                <div className="flex items-center gap-1 p-2 bg-background-card border-2 border-accent-green rounded-lg shadow-elevated">
                    {isEditingLink ? (
                        <>
                            <input
                                type="text"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        applyLink();
                                    }
                                    if (e.key === 'Escape') {
                                        setIsEditingLink(false);
                                        setLinkUrl('');
                                    }
                                }}
                                placeholder="Enter URL..."
                                className="px-2 py-1 text-sm bg-background border border-border rounded text-text-primary w-48 focus:outline-none focus:border-accent-blue"
                                autoFocus
                            />
                            <button
                                onClick={applyLink}
                                className="px-2 py-1 text-xs bg-accent-green text-white rounded hover:bg-accent-green/80"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => { setIsEditingLink(false); setLinkUrl(''); }}
                                className="px-2 py-1 text-xs text-text-muted hover:text-text-primary"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="text-xs text-text-muted px-2 truncate max-w-[150px]">
                                {editor.getAttributes('link').href}
                            </span>
                            <div className="w-px h-4 bg-border" />
                            <button
                                onClick={openLink}
                                className="p-1.5 text-accent-blue hover:bg-background-hover rounded"
                                title="Open link"
                            >
                                <ExternalLink size={14} />
                            </button>
                            <button
                                onClick={() => {
                                    setLinkUrl(editor.getAttributes('link').href || '');
                                    setIsEditingLink(true);
                                }}
                                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-background-hover rounded"
                                title="Edit link"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={removeLink}
                                className="p-1.5 text-accent-red hover:bg-background-hover rounded"
                                title="Remove link"
                            >
                                <Unlink size={14} />
                            </button>
                        </>
                    )}
                </div>
            </BubbleMenu>

            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-border bg-background-card flex-wrap">
                {/* Text Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold (Ctrl+B)"
                >
                    <Bold size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic (Ctrl+I)"
                >
                    <Italic size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Underline (Ctrl+U)"
                >
                    <UnderlineIcon size={16} />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    <ListOrdered size={16} />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Block Elements */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Quote"
                >
                    <Quote size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive('codeBlock')}
                    title="Code Block"
                >
                    <Code size={16} />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Links & Images */}
                <ToolbarButton
                    onClick={setLink}
                    isActive={editor.isActive('link')}
                    title="Add Link"
                >
                    <LinkIcon size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={addImage}
                    isActive={false}
                    title="Add Image"
                >
                    <ImageIcon size={16} />
                </ToolbarButton>

                <div className="flex-1" />

                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    isActive={false}
                    disabled={!editor.can().undo()}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    isActive={false}
                    disabled={!editor.can().redo()}
                    title="Redo (Ctrl+Shift+Z)"
                >
                    <Redo size={16} />
                </ToolbarButton>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />

            {/* Link Input Modal (for toolbar) */}
            {isEditingLink && !editor.isActive('link') && (
                <div className="p-3 border-t border-border bg-background-card">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    applyLink();
                                }
                                if (e.key === 'Escape') {
                                    setIsEditingLink(false);
                                    setLinkUrl('');
                                }
                            }}
                            placeholder="https://example.com"
                            className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded text-text-primary focus:outline-none focus:border-accent-green"
                            autoFocus
                        />
                        <button
                            onClick={applyLink}
                            className="px-3 py-1.5 text-sm bg-accent-green text-white rounded hover:bg-accent-green/80"
                        >
                            Add Link
                        </button>
                        <button
                            onClick={() => { setIsEditingLink(false); setLinkUrl(''); }}
                            className="px-3 py-1.5 text-sm text-text-muted hover:text-text-primary"
                        >
                            Cancel
                        </button>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                        Tip: URLs like "google.com" will automatically get "https://" added
                    </p>
                </div>
            )}

            {/* Styles for the editor */}
            <style>{`
                .ProseMirror {
                    outline: none;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #6B7280;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                .ProseMirror ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                .ProseMirror li {
                    margin: 0.25rem 0;
                }
                .ProseMirror blockquote {
                    border-left: 3px solid #3B82F6;
                    padding-left: 1rem;
                    margin: 0.5rem 0;
                    color: #9CA3AF;
                    font-style: italic;
                }
                .ProseMirror pre {
                    background: #1A1F2B;
                    border-radius: 0.5rem;
                    padding: 0.75rem 1rem;
                    margin: 0.5rem 0;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.875rem;
                    overflow-x: auto;
                }
                .ProseMirror code {
                    background: #1A1F2B;
                    border-radius: 0.25rem;
                    padding: 0.125rem 0.25rem;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.875rem;
                }
                .ProseMirror a {
                    color: #3B82F6;
                    text-decoration: underline;
                    cursor: pointer;
                }
                .ProseMirror a:hover {
                    color: #60A5FA;
                }
                .ProseMirror img {
                    max-width: 100%;
                    border-radius: 0.5rem;
                    margin: 0.5rem 0;
                }
                .ProseMirror h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 1rem 0 0.5rem;
                }
                .ProseMirror h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0.75rem 0 0.5rem;
                }
                .ProseMirror h3 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin: 0.5rem 0 0.25rem;
                }
                .ProseMirror p {
                    margin: 0.25rem 0;
                }
            `}</style>
        </div>
    );
}

// Toolbar button component
function ToolbarButton({
    children,
    onClick,
    isActive,
    disabled = false,
    title
}: {
    children: React.ReactNode;
    onClick: () => void;
    isActive: boolean;
    disabled?: boolean;
    title: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded transition-colors ${isActive
                ? 'bg-accent-blue/20 text-accent-blue'
                : 'text-text-muted hover:bg-background-hover hover:text-text-primary'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );
}
