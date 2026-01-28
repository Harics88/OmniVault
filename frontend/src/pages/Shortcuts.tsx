import { Keyboard, Command } from 'lucide-react';

export default function Shortcuts() {
    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-accent-blue/10 rounded-xl">
                    <Keyboard size={32} className="text-accent-blue" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Keyboard Shortcuts</h1>
                    <p className="text-text-muted">Master your productivity with these keyboard shortcuts</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Command Palette */}
                <section className="bg-background-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Command size={20} className="text-accent-blue" />
                        <h2 className="text-xl font-semibold text-text-primary">Command Palette</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ShortcutItem action="Open Command Palette" keys={['Ctrl', 'K']} />
                        <ShortcutItem action="Quick Search" keys={['/']} />
                        <ShortcutItem action="Command Mode" description="Type > to access commands" />
                        <ShortcutItem action="Search Mode" description="Type normally to search" />
                    </div>
                    <div className="mt-4 p-3 bg-background rounded-lg border border-border-subtle">
                        <p className="text-xs text-text-muted">
                            💡 <strong>Pro Tip:</strong> Use <kbd className="kbd text-xs mx-1">Ctrl+K</kbd> to open the command palette,
                            then type <kbd className="kbd text-xs mx-1">&gt;</kbd> to browse all available commands, or start typing to search.
                        </p>
                    </div>
                </section>

                {/* Navigation */}
                <section className="bg-background-card border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Navigation</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ShortcutItem action="Go Home" keys={['Cmd', 'Shift', 'H']} alternate="g h" />
                        <ShortcutItem action="Go to Daily Log" keys={['Cmd', 'D']} alternate="g d" />
                        <ShortcutItem action="Go to Tasks" keys={['Cmd', 'Shift', 'T']} alternate="g t" />
                        <ShortcutItem action="Go to Notes" keys={['Cmd', 'Shift', 'N']} alternate="g n" />
                        <ShortcutItem action="Go to Snippets" keys={['Cmd', 'Shift', 'S']} alternate="g s" />
                        <ShortcutItem action="Go to Bookmarks" keys={['Cmd', 'Shift', 'B']} alternate="g b" />
                        <ShortcutItem action="Go to Settings" keys={['Cmd', ',']} alternate="g ," />
                        <ShortcutItem action="Show Shortcuts" keys={['?']} />
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="bg-background-card border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ShortcutItem action="Create Task" description="Available via Command Palette" />
                        <ShortcutItem action="Create Note" description="Available via Command Palette" />
                        <ShortcutItem action="Create Snippet" description="Available via Command Palette" />
                        <ShortcutItem action="Toggle Theme" description="Available via Command Palette" />
                        <ShortcutItem action="Export Data" description="Available via Command Palette" />
                        <ShortcutItem action="Toggle Personal Tasks" description="Available via Command Palette" />
                    </div>
                </section>

                {/* Editor Shortcuts */}
                <section className="bg-background-card border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Text Editor</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ShortcutItem action="Save" keys={['Cmd', 'S']} />
                        <ShortcutItem action="Bold" keys={['Cmd', 'B']} />
                        <ShortcutItem action="Italic" keys={['Cmd', 'I']} />
                        <ShortcutItem action="Underline" keys={['Cmd', 'U']} />
                        <ShortcutItem action="Code" keys={['Cmd', 'E']} />
                        <ShortcutItem action="Link" keys={['Cmd', 'K']} />
                        <ShortcutItem action="Heading 1" keys={['Cmd', 'Alt', '1']} />
                        <ShortcutItem action="Heading 2" keys={['Cmd', 'Alt', '2']} />
                        <ShortcutItem action="Bullet List" keys={['Cmd', 'Shift', '8']} />
                        <ShortcutItem action="Numbered List" keys={['Cmd', 'Shift', '7']} />
                        <ShortcutItem action="Code Block" keys={['Cmd', 'Alt', 'C']} />
                        <ShortcutItem action="Quote" keys={['Cmd', 'Shift', 'B']} />
                    </div>
                </section>

                {/* Task Management */}
                <section className="bg-background-card border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Task Management</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ShortcutItem action="Toggle Task Complete" keys={['Space']} description="When focused on task" />
                        <ShortcutItem action="Edit Task" keys={['Enter']} description="When focused on task" />
                        <ShortcutItem action="Close Editor" keys={['Esc']} />
                    </div>
                </section>

                {/* General */}
                <section className="bg-background-card border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">General</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ShortcutItem action="Close Modal/Dialog" keys={['Esc']} />
                        <ShortcutItem action="Submit Form" keys={['Cmd', 'Enter']} />
                        <ShortcutItem action="Navigate List" keys={['↑', '↓']} />
                        <ShortcutItem action="Select Item" keys={['Enter']} />
                    </div>
                </section>

                {/* Legend */}
                <div className="bg-background-elevated border border-border-subtle rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-text-primary mb-2">Key Symbols</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-text-muted">
                        <div><kbd className="kbd text-xs">⌘</kbd> Command (Mac) / Ctrl (Win)</div>
                        <div><kbd className="kbd text-xs">⇧</kbd> Shift</div>
                        <div><kbd className="kbd text-xs">⌥</kbd> Option (Mac) / Alt (Win)</div>
                        <div><kbd className="kbd text-xs">↵</kbd> Enter/Return</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ShortcutItemProps {
    action: string;
    keys?: string[];
    alternate?: string;
    description?: string;
}

function ShortcutItem({ action, keys, alternate, description }: ShortcutItemProps) {
    return (
        <div className="flex justify-between items-center p-3 rounded-lg bg-background border border-border-subtle hover:border-border transition-colors">
            <div className="flex-1">
                <span className="text-sm text-text-primary font-medium">{action}</span>
                {description && (
                    <p className="text-xs text-text-muted mt-0.5">{description}</p>
                )}
            </div>
            <div className="flex items-center gap-2">
                {keys && (
                    <div className="flex items-center gap-1">
                        {keys.map((key, index) => (
                            <span key={index} className="flex items-center">
                                <kbd className="kbd text-xs">{key}</kbd>
                                {index < keys.length - 1 && <span className="mx-0.5 text-text-muted">+</span>}
                            </span>
                        ))}
                    </div>
                )}
                {alternate && (
                    <div className="flex items-center gap-1">
                        {keys && <span className="text-text-muted text-xs">or</span>}
                        <kbd className="kbd text-xs bg-background-elevated">{alternate}</kbd>
                    </div>
                )}
            </div>
        </div>
    );
}
