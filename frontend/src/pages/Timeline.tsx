import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Activity,
    Calendar,
    ChevronRight,
    Search,
    Loader2,
    CheckSquare,
    FileText,
    Zap
} from 'lucide-react';
import { systemApi, logEntriesApi } from '../lib/api';
import { formatDisplayDate } from '../utils/date';
import { EntryDetailModal } from '../components/EntryDetailModal';
import { useToast } from '../components/Toast';

const typeConfig: any = {
    log_entry: { icon: Activity, label: 'DAILY LOG', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    task: { icon: CheckSquare, label: 'TASK', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    note: { icon: FileText, label: 'NOTE', color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

const Timeline: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<'all' | 'log_entry' | 'task' | 'note'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
    const { showToast } = useToast();

    const { data: timeline = [], isLoading: loading } = useQuery({
        queryKey: ['system', 'timeline'],
        queryFn: () => systemApi.getGlobalTimeline(100),
    });

    const handleUpdateEntry = async (id: number, data: any) => {
        try {
            await logEntriesApi.update(id, data);
            showToast('Entry updated successfully');
            queryClient.invalidateQueries({ queryKey: ['system', 'timeline'] });
            queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
        } catch (error) {
            console.error('Failed to update entry:', error);
            showToast('Failed to update entry');
        }
    };

    const handleDeleteEntry = async (id: number) => {
        try {
            await logEntriesApi.delete(id);
            showToast('Entry deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['system', 'timeline'] });
            queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
        } catch (error) {
            console.error('Failed to delete entry:', error);
            showToast('Failed to delete entry');
        }
    };

    const handleItemClick = (item: any) => {
        if (item.type === 'log_entry') {
            setSelectedEntry(item);
        } else if (item.type === 'task') {
            navigate(`/tasks/${item.id}`);
        } else if (item.type === 'note') {
            navigate(`/notes/${item.id}`);
        }
    };

    const filteredTimeline = timeline.filter(item => {
        const matchesFilter = filter === 'all' || item.type === filter;
        const matchesSearch = !searchQuery ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="h-full flex flex-col bg-background animate-fade-in overflow-hidden">
            <header className="px-8 py-6 border-b border-border bg-background-card/50 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                            <Zap className="text-accent-blue" size={24} />
                            Activity Timeline
                        </h1>
                        <p className="text-sm text-text-muted">A comprehensive stream of your recent work and thoughts</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                            <input
                                type="text"
                                placeholder="Search activity..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-background border border-border rounded-xl py-2 pl-9 pr-4 text-sm text-text-primary focus:ring-2 focus:ring-accent-blue outline-none transition-all w-64"
                            />
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto flex items-center gap-2 mt-6 overflow-x-auto pb-1 no-scrollbar">
                    {(['all', 'log_entry', 'task', 'note'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${filter === f
                                ? 'bg-accent-blue/10 border-accent-blue text-accent-blue shadow-sm'
                                : 'bg-background-elevated border-border text-text-muted hover:text-text-primary hover:border-text-muted'
                                }`}
                        >
                            {f === 'all' ? <Activity size={12} /> : React.createElement(typeConfig[f].icon, { size: 12 })}
                            {f === 'log_entry' ? 'Logs' : f === 'all' ? 'All Activity' : f + 's'}
                        </button>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 opacity-50">
                            <Loader2 className="animate-spin text-accent-blue mb-4" size={32} />
                            <p className="font-medium">Curating your timeline...</p>
                        </div>
                    ) : filteredTimeline.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                            <Activity size={48} className="mb-4" />
                            <p className="text-lg font-bold text-text-primary">No matching moments found</p>
                            <p className="text-sm">Try broadening your search or filters</p>
                        </div>
                    ) : (
                        <div className="relative ml-4 pl-10 border-l-2 border-border space-y-12 pb-20">
                            {filteredTimeline.map((item, idx) => {
                                const config = typeConfig[item.type] || typeConfig.log_entry;
                                const Icon = config.icon;
                                return (
                                    <div key={`${item.type}-${item.id}`} className="relative group animate-slide-up" style={{ animationDelay: `${idx * 30}ms` }}>
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-[51px] top-4 w-6 h-6 rounded-full border-4 border-background ${config.bg} ${config.color} shadow-sm z-10 group-hover:scale-125 transition-transform flex items-center justify-center`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                        </div>

                                        <div
                                            className="bg-background-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-accent-blue/30 transition-all cursor-pointer"
                                            onClick={() => handleItemClick(item)}
                                        >
                                            <div className="p-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${config.bg} ${config.color}`}>
                                                            <div className="flex items-center gap-1.5">
                                                                <Icon size={12} />
                                                                {config.label}
                                                            </div>
                                                        </span>
                                                        <span className="text-xs font-mono text-text-muted flex items-center gap-1.5">
                                                            <Calendar size={12} />
                                                            {formatDisplayDate(item.timestamp, 'MMM d, yyyy · h:mm a')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {/* Actions removed as requested */}
                                                    </div>
                                                </div>

                                                <h4 className="text-xl font-bold text-text-primary mb-3 group-hover:text-accent-blue transition-colors leading-snug">
                                                    {item.title}
                                                </h4>

                                                {item.content && (
                                                    <div
                                                        className="text-sm text-text-secondary line-clamp-3 leading-relaxed opacity-80 prose prose-invert prose-sm max-w-none"
                                                        dangerouslySetInnerHTML={{ __html: item.content }}
                                                    />
                                                )}

                                                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        {item.status && (
                                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.status === 'done' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                                {item.status}
                                                            </span>
                                                        )}
                                                        {item.priority && (
                                                            <span className="text-[10px] text-text-muted uppercase font-bold">P{item.priority}</span>
                                                        )}
                                                        {item.language && (
                                                            <span className="text-[10px] text-text-muted uppercase font-bold font-mono">{item.language}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-text-muted flex items-center gap-1 group-hover:text-accent-blue transition-colors">
                                                        View details <ChevronRight size={14} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <EntryDetailModal
                isOpen={!!selectedEntry}
                entry={selectedEntry}
                onClose={() => setSelectedEntry(null)}
                onEdit={handleUpdateEntry}
                onDelete={handleDeleteEntry}
            />
        </div>
    );
};

export default Timeline;
