import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, X } from 'lucide-react';
import axios from 'axios';

interface TagItem {
    id: number;
    name: string;
    color: string;
}

interface TagManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TagManager({ isOpen, onClose }: TagManagerProps) {
    const [tags, setTags] = useState<TagItem[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3b82f6');
    const [loading, setLoading] = useState(false);

    const fetchTags = async () => {
        try {
            const response = await axios.get('/api/tags/');
            setTags(response.data);
        } catch (error) {
            console.error('Failed to fetch tags', error);
        }
    };

    useEffect(() => {
        if (isOpen) fetchTags();
    }, [isOpen]);

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        setLoading(true);
        try {
            await axios.post('/api/tags/', { name: newTagName, color: newTagColor });
            setNewTagName('');
            fetchTags();
        } catch (error) {
            console.error('Failed to create tag', error);
            alert('Failed to create tag. Name might already exist.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTag = async (id: number) => {
        if (!confirm('Delete this tag?')) return;
        try {
            await axios.delete(`/api/tags/${id}`);
            fetchTags();
        } catch (error) {
            console.error('Failed to delete tag', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-background-card rounded-xl shadow-2xl border border-border flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Tag size={20} className="text-accent-blue" />
                        <h2 className="text-lg font-semibold text-text-primary">Tag Manager</h2>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="New tag name..."
                            className="input flex-1"
                        />
                        <input
                            type="color"
                            value={newTagColor}
                            onChange={(e) => setNewTagColor(e.target.value)}
                            className="h-10 w-10 p-1 rounded border border-border cursor-pointer bg-background"
                        />
                        <button
                            onClick={handleCreateTag}
                            disabled={!newTagName.trim() || loading}
                            className="btn btn-primary"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {tags.map((tag) => (
                            <div key={tag.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-border-hover transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                                        style={{ backgroundColor: tag.color }}
                                    />
                                    <span className="font-medium text-text-primary">{tag.name}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteTag(tag.id)}
                                    className="text-text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {tags.length === 0 && (
                            <p className="text-center text-text-muted text-sm py-4">No tags created yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
