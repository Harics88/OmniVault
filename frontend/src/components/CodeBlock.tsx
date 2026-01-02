import { Highlight, themes } from 'prism-react-renderer';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
    code: string;
    language: string;
    title?: string;
}

export default function CodeBlock({ code, language, title }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-lg overflow-hidden border border-border-subtle bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-background-card border-b border-border-subtle">
                <div className="flex items-center gap-2">
                    {title && <span className="text-sm font-medium text-text-primary">{title}</span>}
                    <span className="badge badge-blue">{language}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-background-hover rounded-md transition-colors"
                >
                    {copied ? (
                        <Check size={14} className="text-accent-green" />
                    ) : (
                        <Copy size={14} className="text-text-muted" />
                    )}
                </button>
            </div>

            {/* Code */}
            <Highlight theme={themes.nightOwl} code={code.trim()} language={language}>
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre
                        className={`${className} p-4 overflow-x-auto text-sm font-mono`}
                        style={{ ...style, background: 'transparent', margin: 0 }}
                    >
                        {tokens.map((line, i) => (
                            <div key={i} {...getLineProps({ line })} className="flex">
                                <span className="select-none w-8 text-text-muted text-right mr-4 opacity-50">
                                    {i + 1}
                                </span>
                                <span>
                                    {line.map((token, key) => (
                                        <span key={key} {...getTokenProps({ token })} />
                                    ))}
                                </span>
                            </div>
                        ))}
                    </pre>
                )}
            </Highlight>
        </div>
    );
}
