import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Server,
    Database,
    Briefcase,
    Users,
    Settings,
    Globe,
    Plus,
    Search,
    Clock,
    ExternalLink,
    Edit2,
    Trash2,
    Activity,
    ChevronRight,
    X
} from 'lucide-react';
import { entitiesApi, logEntriesApi } from '../lib/api';
import { Entity, EntityType, CreateEntity, UpdateEntity } from '../types';
import { format } from 'date-fns';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { EntryDetailModal } from '../components/EntryDetailModal';

const Registry: React.FC = () => {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<EntityType | 'all'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        loadEntities();
    }, []);

    const loadEntities = async () => {
        setLoading(true);
        try {
            const data = await entitiesApi.getAll();
            setEntities(data);
        } catch (error) {
            console.error('Failed to load entities:', error);
            showToast('Failed to load entities');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEntity = async (entityData: CreateEntity) => {
        try {
            await entitiesApi.create(entityData);
            showToast('Entity created successfully');
            loadEntities();
            setShowAddModal(false);
        } catch (error) {
            showToast('Failed to create entity');
        }
    };

    const handleUpdateEntity = async (id: number, entityData: UpdateEntity) => {
        try {
            await entitiesApi.update(id, entityData);
            showToast('Entity updated successfully');
            loadEntities();
            setEditingEntity(null);
        } catch (error) {
            showToast('Failed to update entity');
        }
    };

    const handleDeleteEntity = async () => {
        if (!entityToDelete) return;
        try {
            await entitiesApi.delete(entityToDelete.id);
            showToast('Entity deleted successfully');
            loadEntities();
            setDeleteConfirmOpen(false);
        } catch (error) {
            showToast('Failed to delete entity');
        }
    };

    const openTimeline = async (entity: Entity) => {
        setSelectedEntity(entity);
        setLoadingTimeline(true);
        try {
            const data = await entitiesApi.getTimeline(entity.id);
            setTimeline(data.timeline);
        } catch (error) {
            console.error('Failed to load timeline:', error);
        } finally {
            setLoadingTimeline(false);
        }
    };

    const handleUpdateEntry = async (id: number, data: any) => {
        try {
            await logEntriesApi.update(id, data);
            showToast('Entry updated successfully');
            if (selectedEntity) openTimeline(selectedEntity);
        } catch (error) {
            console.error('Failed to update entry:', error);
            showToast('Failed to update entry');
        }
    };

    const handleDeleteEntry = async (id: number) => {
        try {
            await logEntriesApi.delete(id);
            showToast('Entry deleted successfully');
            if (selectedEntity) openTimeline(selectedEntity);
        } catch (error) {
            console.error('Failed to delete entry:', error);
            showToast('Failed to delete entry');
        }
    };

    const filteredEntities = entities.filter(e => {
        const matchesType = filterType === 'all' || e.type === filterType;
        const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.aliases && e.aliases.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesType && matchesSearch;
    });

    const getIcon = (type: EntityType) => {
        switch (type) {
            case 'server': return <Server size={18} />;
            case 'database': return <Database size={18} />;
            case 'project': return <Briefcase size={18} />;
            case 'client': return <Users size={18} />;
            case 'service': return <Settings size={18} />;
            case 'environment': return <Globe size={18} />;
            default: return <Server size={18} />;
        }
    };

    const getTypeColor = (type: EntityType) => {
        switch (type) {
            case 'server': return 'text-blue-500 bg-blue-500/10';
            case 'database': return 'text-emerald-500 bg-emerald-500/10';
            case 'project': return 'text-purple-500 bg-purple-500/10';
            case 'client': return 'text-orange-500 bg-orange-500/10';
            case 'service': return 'text-sky-500 bg-sky-500/10';
            case 'environment': return 'text-rose-500 bg-rose-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                        <span className="text-accent-amber">Registry</span>
                    </h1>
                    <p className="text-text-muted mt-1">Infrastructure and project asset tracking</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-accent-blue hover:bg-accent-blue/90 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-accent-blue/20"
                >
                    <Plus size={18} />
                    <span>Register Entity</span>
                </button>
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search entities or aliases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background-elevated border border-border rounded-xl py-2.5 pl-10 pr-4 text-text-primary focus:ring-2 focus:ring-accent-blue focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2 min-w-max">
                    <div className="flex bg-background-elevated border border-border rounded-xl p-1">
                        {(['all', 'server', 'database', 'project', 'client'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filterType === type
                                    ? 'bg-background-card text-text-primary shadow-sm ring-1 ring-border'
                                    : 'text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Entity List */}
            <div className="bg-background-card border border-border rounded-2xl overflow-hidden shadow-sm flex-1">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-background-elevated border-b border-border">
                            <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Entity</th>
                            <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Aliases</th>
                            <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-8">
                                        <div className="h-4 bg-background-elevated rounded w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : filteredEntities.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-text-muted">
                                    <div className="flex flex-col items-center gap-2">
                                        <Server size={40} className="opacity-20" />
                                        <p>No entities found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredEntities.map(entity => (
                                <tr
                                    key={entity.id}
                                    className="hover:bg-background-elevated/50 transition-colors cursor-pointer group"
                                    onClick={() => openTimeline(entity)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${getTypeColor(entity.type)} shadow-sm`}>
                                                {getIcon(entity.type)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-text-primary">{entity.name}</div>
                                                <div className="text-[10px] font-mono text-text-muted">ID: {entity.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getTypeColor(entity.type)} border-current/20`}>
                                            {entity.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {entity.aliases ? entity.aliases.split(',').map(alias => (
                                                <span key={alias} className="px-2 py-0.5 rounded-full bg-background-elevated border border-border text-[10px] text-text-secondary">
                                                    {alias.trim()}
                                                </span>
                                            )) : <span className="text-text-muted text-xs italic">—</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${entity.status.toLowerCase() === 'active' ? 'text-emerald-500' : 'text-text-muted'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${entity.status.toLowerCase() === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-text-muted'
                                                }`} />
                                            {entity.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => openTimeline(entity)}
                                                className="p-1.5 hover:bg-background-elevated rounded-lg text-text-muted hover:text-accent-blue transition-colors"
                                                title="View Timeline"
                                            >
                                                <Activity size={16} />
                                            </button>
                                            <button
                                                onClick={() => setEditingEntity(entity)}
                                                className="p-1.5 hover:bg-background-elevated rounded-lg text-text-muted hover:text-accent-blue transition-colors"
                                                title="Edit Entity"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEntityToDelete(entity);
                                                    setDeleteConfirmOpen(true);
                                                }}
                                                className="p-1.5 hover:bg-background-elevated rounded-lg text-text-muted hover:text-accent-red transition-colors"
                                                title="Delete Entity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals and Sidebars */}
            <EntityModal
                isOpen={showAddModal || !!editingEntity}
                entity={editingEntity}
                onClose={() => {
                    setShowAddModal(false);
                    setEditingEntity(null);
                }}
                onSave={(data) => {
                    if (editingEntity) handleUpdateEntity(editingEntity.id, data);
                    else handleAddEntity(data as CreateEntity);
                }}
            />

            <ActivitiesDrawer
                entity={selectedEntity}
                timeline={timeline}
                loading={loadingTimeline}
                onClose={() => setSelectedEntity(null)}
                onItemSelect={(item) => setSelectedEntry(item)}
            />

            <EntryDetailModal
                isOpen={!!selectedEntry}
                entry={selectedEntry}
                onClose={() => setSelectedEntry(null)}
                onEdit={handleUpdateEntry}
                onDelete={handleDeleteEntry}
            />

            <ConfirmModal
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleDeleteEntity}
                title="Delete Entity"
                message={`Are you sure you want to delete "${entityToDelete?.name}"? All associated links will be removed.`}
            />
        </div>
    );
};

// --- Subcomponents ---

interface EntityModalProps {
    isOpen: boolean;
    entity: Entity | null;
    onClose: () => void;
    onSave: (data: Partial<Entity>) => void;
}

const EntityModal: React.FC<EntityModalProps> = ({ isOpen, entity, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<EntityType>('server');
    const [aliases, setAliases] = useState('');
    const [status, setStatus] = useState('Active');
    const [metaJson, setMetaJson] = useState('{}');

    useEffect(() => {
        if (entity) {
            setName(entity.name);
            setType(entity.type);
            setAliases(entity.aliases || '');
            setStatus(entity.status);
            setMetaJson(entity.meta_json);
        } else {
            setName('');
            setType('server');
            setAliases('');
            setStatus('Active');
            setMetaJson('{}');
        }
    }, [entity, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, type, aliases, status, meta_json: metaJson });
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-background-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background-elevated">
                    <h2 className="text-xl font-bold text-text-primary">{entity ? 'Edit Entity' : 'Register New Entity'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-background-card rounded-xl text-text-muted transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Entity Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                className="w-full bg-background-elevated border border-border rounded-xl py-2 px-4 focus:ring-2 focus:ring-accent-blue outline-none transition-all"
                                placeholder="e.g. dc-prod-db-01"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Type</label>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value as EntityType)}
                                className="w-full bg-background-elevated border border-border rounded-xl py-2 px-4 focus:ring-2 focus:ring-accent-blue outline-none cursor-pointer"
                            >
                                <option value="server">Server</option>
                                <option value="database">Database</option>
                                <option value="project">Project</option>
                                <option value="client">Client</option>
                                <option value="service">Service</option>
                                <option value="environment">Environment</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Status</label>
                            <input
                                type="text"
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                className="w-full bg-background-elevated border border-border rounded-xl py-2 px-4 focus:ring-2 focus:ring-accent-blue outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Aliases (comma separated)</label>
                        <input
                            type="text"
                            value={aliases}
                            onChange={e => setAliases(e.target.value)}
                            className="w-full bg-background-elevated border border-border rounded-xl py-2 px-4 focus:ring-2 focus:ring-accent-blue outline-none"
                            placeholder="e.g. PROD-DB, Primary Storage"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Metadata (JSON)</label>
                        <textarea
                            value={metaJson}
                            onChange={e => setMetaJson(e.target.value)}
                            rows={3}
                            className="w-full bg-background-elevated border border-border rounded-xl py-2 px-4 focus:ring-2 focus:ring-accent-blue outline-none font-mono text-xs"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-background-elevated transition-colors text-sm font-semibold text-text-secondary">Cancel</button>
                        <button type="submit" className="flex-1 py-2.5 bg-accent-blue text-white rounded-xl shadow-lg shadow-accent-blue/20 hover:bg-accent-blue/90 transition-all text-sm font-bold">Save Entity</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ActivitiesDrawerProps {
    entity: Entity | null;
    timeline: any[];
    loading: boolean;
    onClose: () => void;
    onItemSelect: (item: any) => void;
}

const ActivitiesDrawer: React.FC<ActivitiesDrawerProps> = ({ entity, timeline, loading, onClose, onItemSelect }) => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const isOpen = !!entity;

    const handleItemClick = (item: any) => {
        if (item.type === 'log_entry') {
            onItemSelect(item);
        } else if (item.type === 'task') {
            navigate(`/tasks/${item.id}`);
        } else if (item.type === 'note') {
            navigate(`/notes/${item.id}`);
        }
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-[1100] bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-lg bg-background border-l border-border z-[1200] shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-border bg-background-card flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-accent-amber/10 rounded-xl text-accent-amber border border-accent-amber/20">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-text-primary">{entity?.name}</h3>
                                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Entity Timeline</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-background-elevated rounded-xl text-text-muted transition-colors"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {loading ? (
                            <div className="flex flex-col gap-6">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex gap-4 animate-pulse">
                                        <div className="w-10 h-10 bg-background-elevated rounded-full" />
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-4 bg-background-elevated rounded w-1/4" />
                                            <div className="h-3 bg-background-elevated rounded w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : timeline.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-text-muted">
                                <Clock size={40} className="mb-4 opacity-10" />
                                <p>No activities linked to this entity yet.</p>
                            </div>
                        ) : (
                            <div className="relative ml-4 pl-8 border-l-2 border-border space-y-8">
                                {timeline.map((item) => (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className="relative group cursor-pointer"
                                        onClick={() => handleItemClick(item)}
                                    >
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[41px] top-1.5 w-5 h-5 rounded-full border-4 border-background bg-accent-blue shadow-sm z-10 group-hover:scale-125 transition-transform" />

                                        <div className="bg-background-card border border-border rounded-2xl p-4 shadow-sm group-hover:shadow-md group-hover:border-accent-blue/30 transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.type === 'log_entry' ? 'bg-amber-500/10 text-amber-500' :
                                                        item.type === 'task' ? 'bg-emerald-500/10 text-emerald-500' :
                                                            'bg-purple-500/10 text-purple-500'
                                                        }`}>
                                                        {item.type.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-text-muted flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {format(new Date(item.timestamp), 'MMM d, yyyy HH:mm')}
                                                    </span>
                                                </div>
                                                <button className="text-text-muted hover:text-accent-blue transition-colors">
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                            <h4 className="text-sm font-bold text-text-primary mb-1 line-clamp-1">{item.title}</h4>
                                            {item.type === 'log_entry' && item.content && (
                                                <div
                                                    className="text-xs text-text-muted line-clamp-2 italic opacity-70 prose-invert prose-xs"
                                                    dangerouslySetInnerHTML={{ __html: item.content }}
                                                />
                                            )}
                                            {item.type === 'task' && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className={`w-2 h-2 rounded-full ${item.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    <span className="text-[10px] text-text-muted uppercase font-bold">{item.status.replace('_', ' ')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-border bg-background-elevated">
                        <button
                            className="w-full py-3 bg-background border border-border rounded-xl text-sm font-bold text-text-secondary hover:bg-background-card transition-all flex items-center justify-center gap-2 shadow-sm"
                            onClick={() => {
                                // Potentially jump to full timeline page
                                showToast('Full timeline view coming soon...');
                            }}
                        >
                            <ExternalLink size={16} />
                            Open Detailed Analysis
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Registry;
