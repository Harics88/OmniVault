import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft,
    Activity,
    Clock,
    Calendar,
    Server,
    Database,
    Briefcase,
    Users,
    Settings,
    Globe,
    Edit2,
    ExternalLink,
    Search,
    Loader2
} from 'lucide-react';
import { entitiesApi } from '../lib/api';
import { Entity, EntityType } from '../types';
import { format } from 'date-fns';

const EntityDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [entity, setEntity] = useState<Entity | null>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'log_entry' | 'task' | 'note'>('all');

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [entityData, timelineData] = await Promise.all([
                entitiesApi.getById(parseInt(id!)),
                entitiesApi.getTimeline(parseInt(id!))
            ]);
            setEntity(entityData);
            setTimeline(timelineData.timeline);
        } catch (error) {
            console.error('Failed to load entity detail:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    if (!entity) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-text-primary">Entity not found</h2>
                <button onClick={() => navigate('/registry')} className="mt-4 text-accent-blue hover:underline">Back to Registry</button>
            </div>
        );
    }

    const filteredTimeline = timeline.filter(item => filter === 'all' || item.type === filter);

    const getIcon = (type: EntityType) => {
        switch (type) {
            case 'server': return <Server size={24} />;
            case 'database': return <Database size={24} />;
            case 'project': return <Briefcase size={24} />;
            case 'client': return <Users size={24} />;
            case 'service': return <Settings size={24} />;
            case 'environment': return <Globe size={24} />;
            default: return <Server size={24} />;
        }
    };

    return (
        <div className="h-full flex flex-col bg-background animate-fade-in overflow-hidden">
            {/* Breadcrumbs / Header */}
            <header className="px-8 py-6 border-b border-border bg-background-card/50 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link to="/registry" className="p-2 hover:bg-background-elevated rounded-xl text-text-muted transition-all">
                            <ChevronLeft size={24} />
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 text-accent-blue flex items-center justify-center border border-accent-blue/20 shadow-sm">
                                {getIcon(entity.type)}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-text-primary">{entity.name}</h1>
                                    <span className="px-2 py-0.5 rounded-full bg-background-elevated border border-border text-[10px] font-bold text-text-muted uppercase tracking-widest">{entity.type}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs text-text-muted flex items-center gap-1"><Clock size={12} /> Registered {format(new Date(entity.created_at), 'MMM d, yyyy')}</span>
                                    <span className={`text-xs font-bold flex items-center gap-1.5 ${entity.status.toLowerCase() === 'active' ? 'text-emerald-500' : 'text-text-muted'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${entity.status.toLowerCase() === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-text-muted'}`} />
                                        {entity.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 bg-background-elevated hover:bg-background-hover border border-border text-text-primary px-4 py-2 rounded-xl transition-all font-bold text-sm">
                        <Edit2 size={16} />
                        Edit Details
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar: Details & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <section className="bg-background-card border border-border rounded-3xl p-6 shadow-sm">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Search size={14} />
                                Metadata
                            </h3>
                            <div className="space-y-4">
                                {entity.aliases && (
                                    <div>
                                        <label className="text-[10px] text-text-muted uppercase font-bold block mb-1">Aliases</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {entity.aliases.split(',').map(a => (
                                                <span key={a} className="px-2 py-0.5 rounded-md bg-background-elevated border border-border text-xs text-text-secondary">{a.trim()}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] text-text-muted uppercase font-bold block mb-1">Infrastructure Details</label>
                                    <pre className="text-[11px] font-mono p-3 rounded-xl bg-background-elevated border border-border overflow-x-auto text-accent-blue/80">
                                        {JSON.stringify(JSON.parse(entity.meta_json), null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </section>

                        <section className="bg-background-card border border-border rounded-3xl p-6 shadow-sm">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={14} />
                                Activity Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-background-elevated border border-border text-center">
                                    <div className="text-2xl font-bold text-text-primary">{timeline.length}</div>
                                    <div className="text-[10px] text-text-muted uppercase font-bold">Total Events</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-background-elevated border border-border text-center">
                                    <div className="text-2xl font-bold text-accent-amber">{timeline.filter(i => i.type === 'log_entry').length}</div>
                                    <div className="text-[10px] text-text-muted uppercase font-bold">Logs</div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Main: Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-background-card border border-border rounded-3xl flex flex-col min-h-[600px] shadow-sm">
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={16} />
                                    Chronological Timeline
                                </h3>
                                <div className="flex items-center gap-2 bg-background-elevated rounded-xl p-1 border border-border">
                                    {(['all', 'log_entry', 'task', 'note'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${filter === f ? 'bg-background-card text-accent-blue shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                                        >
                                            {f === 'log_entry' ? 'Logs' : f === 'all' ? 'All' : f + 's'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8">
                                {filteredTimeline.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                                        <Activity size={48} className="mb-4" />
                                        <p className="text-lg font-bold">No matching records found</p>
                                    </div>
                                ) : (
                                    <div className="relative ml-4 pl-10 border-l-2 border-border space-y-2">
                                        {filteredTimeline.map((item) => (
                                            <div key={`${item.type}-${item.id}`} className="relative group mb-8">
                                                {/* Timeline Dot */}
                                                <div className="absolute -left-[51px] top-1.5 w-6 h-6 rounded-full border-4 border-background bg-accent-blue shadow-sm z-10 group-hover:scale-125 transition-transform" />

                                                <div className="bg-background-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-accent-blue/30 transition-all">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.type === 'log_entry' ? 'bg-amber-500/10 text-amber-500' :
                                                                item.type === 'task' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                    item.type === 'note' ? 'bg-purple-500/10 text-purple-500' :
                                                                        'bg-sky-500/10 text-sky-500'
                                                                }`}>
                                                                {item.type.replace('_', ' ')}
                                                            </span>
                                                            <span className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                                                                <Calendar size={12} />
                                                                {format(new Date(item.timestamp), 'MMMM d, yyyy · HH:mm')}
                                                            </span>
                                                        </div>
                                                        <Link
                                                            to={item.type === 'log_entry' ? `/daily-log/${format(new Date(item.timestamp), 'yyyy-MM-dd')}` :
                                                                item.type === 'task' ? `/tasks` : `/notes/${item.id}`}
                                                            className="text-text-muted hover:text-accent-blue transition-colors p-1.5 hover:bg-background-elevated rounded-lg"
                                                            title="Jump to Source"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </Link>
                                                    </div>
                                                    <h4 className="text-base font-bold text-text-primary mb-2">{item.title}</h4>
                                                    {item.content && (
                                                        <div
                                                            className="text-sm text-text-secondary line-clamp-3 leading-relaxed opacity-80 prose-invert prose-sm"
                                                            dangerouslySetInnerHTML={{ __html: item.content }}
                                                        />
                                                    )}
                                                    {item.type === 'task' && (
                                                        <div className="flex items-center gap-3 mt-3">
                                                            <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${item.status === 'done' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                                                }`}>
                                                                {item.status}
                                                            </div>
                                                            {item.priority && (
                                                                <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Priority: {item.priority}</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EntityDetail;
