import React from 'react';
import { Keyboard } from 'lucide-react';

export default function Shortcuts() {
    return (
        <div className="p-8 max-w-4xl mx-auto animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <Keyboard size={32} className="text-accent-blue" />
                <h1 className="text-3xl font-bold text-text-primary">Keyboard Shortcuts</h1>
            </div>

            <div className="bg-background-card border border-border rounded-lg p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-lg font-semibold mb-4 text-text-primary">Navigation</h2>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Go Home</span>
                                <kbd className="kbd">⌘ + ⇧ + H</kbd>
                            </li>
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Go to Tasks</span>
                                <kbd className="kbd">⌘ + ⇧ + T</kbd>
                            </li>
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Go to Daily Log</span>
                                <kbd className="kbd">⌘ + D</kbd>
                            </li>
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Go to Notes</span>
                                <kbd className="kbd">⌘ + ⇧ + N</kbd>
                            </li>
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Go to Snippets</span>
                                <kbd className="kbd">⌘ + ⇧ + S</kbd>
                            </li>
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Go to Bookmarks</span>
                                <kbd className="kbd">⌘ + ⇧ + B</kbd>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold mb-4 text-text-primary">Global</h2>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Global Search</span>
                                <kbd className="kbd">⌘ + K</kbd>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
