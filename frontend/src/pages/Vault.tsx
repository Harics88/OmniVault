import React, { useState, useEffect } from 'react';
import PINEntry from '../components/PINEntry';
import { Secret, SecretType, CreateSecret, DatabaseMetadata, SFTPMetadata, WebsiteMetadata } from '../types';

// Use relative URLs for API calls (works in all environments)
const API_BASE = '/api';

const Vault: React.FC = () => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isPinSetup, setIsPinSetup] = useState(false);
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [filter, setFilter] = useState<SecretType | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isModalReadOnly, setIsModalReadOnly] = useState(true);
    const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if PIN is set up
    useEffect(() => {
        checkPinStatus();
    }, []);

    // Load secrets when unlocked
    useEffect(() => {
        if (isUnlocked) {
            loadSecrets();
        }
    }, [isUnlocked]);

    const checkPinStatus = async () => {
        try {
            const response = await fetch(`${API_BASE}/vault/pin/status`);
            const data = await response.json();
            setIsPinSetup(data.is_setup);

            // If PIN is not enabled in settings, unlock automatically
            if (data.is_setup && data.is_enabled === false) {
                setIsUnlocked(true);
            }
        } catch (error) {
            console.error('Failed to check PIN status:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSecrets = async () => {
        try {
            const response = await fetch(`${API_BASE}/vault/secrets`);
            if (response.ok) {
                const data = await response.json();
                setSecrets(data);
            }
        } catch (error) {
            console.error('Failed to load secrets:', error);
        }
    };

    const handlePinSuccess = () => {
        setIsUnlocked(true);
        if (!isPinSetup) {
            setIsPinSetup(true);
        }
    };


    const handleLock = () => {
        setIsUnlocked(false);
    };

    const handleDeleteSecret = async (id: number) => {
        if (!confirm('Delete this secret?')) return;

        try {
            const response = await fetch(`${API_BASE}/vault/secrets/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSecrets(secrets.filter((s) => s.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete secret:', error);
        }
    };

    const handleCopyPassword = async (secret: Secret) => {
        try {
            await navigator.clipboard.writeText(secret.password);
            // Show toast notification (you can add a toast library)
            alert('Password copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy password:', error);
        }
    };

    const handleCopyConnectionString = async (secret: Secret) => {
        try {
            const response = await fetch(`${API_BASE}/vault/secrets/${secret.id}/connection-string`);
            if (response.ok) {
                const data = await response.json();
                await navigator.clipboard.writeText(data.connection_string);
                alert('Connection string copied to clipboard!');
            }
        } catch (error) {
            console.error('Failed to copy connection string:', error);
        }
    };

    const handleLaunchWebsite = async (secret: Secret) => {
        const metadata: WebsiteMetadata = JSON.parse(secret.metadata);
        let url = metadata.url;

        // Ensure URL has protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        // Copy username to clipboard
        if (secret.username) {
            await navigator.clipboard.writeText(secret.username);
        }

        // Open URL
        window.open(url, '_blank');
    };

    const filteredSecrets = secrets.filter((secret) => {
        if (filter !== 'all' && secret.type !== filter) return false;
        if (selectedTag && (!secret.tags || !secret.tags.includes(selectedTag))) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                secret.label.toLowerCase().includes(query) ||
                (secret.username && secret.username.toLowerCase().includes(query)) ||
                secret.metadata.toLowerCase().includes(query) ||
                (secret.tags && secret.tags.toLowerCase().includes(query))
            );
        }
        return true;
    });

    // Show PIN entry if not unlocked
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isUnlocked) {
        return (
            <PINEntry
                mode={isPinSetup ? 'verify' : 'setup'}
                onSuccess={handlePinSuccess}
            />
        );
    }

    // Main vault interface
    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span>🔐</span>
                        Vault
                    </h1>
                    <p className="text-gray-400 mt-1">Securely store your credentials</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setEditingSecret(null);
                            setIsModalReadOnly(false);
                            setShowForm(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <span>+</span>
                        Add Secret
                    </button>
                    <button
                        onClick={handleLock}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <span>🔒</span>
                        Lock
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {[
                            { id: 'all', label: 'All', icon: '📁', color: 'bg-blue-600' },
                            { id: 'database', label: 'Database', icon: '/assets/vault/database.png', color: 'bg-green-600' },
                            { id: 'sftp', label: 'Sftp', icon: '/assets/vault/sftp.png', color: 'bg-orange-600' },
                            { id: 'website', label: 'Website', icon: '/assets/vault/website.png', color: 'bg-purple-600' },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setFilter(t.id as any)}
                                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2.5 font-bold text-xs uppercase tracking-wider ${filter === t.id
                                    ? `${t.color} text-white shadow-lg shadow-blue-500/20 scale-105 border border-white/20`
                                    : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700/50'
                                    }`}
                            >
                                {t.icon.startsWith('/') ? (
                                    <img src={t.icon} alt="" className="w-4 h-4 object-contain brightness-110" />
                                ) : (
                                    <span className="text-sm">{t.icon}</span>
                                )}
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Search secrets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Tag Filters */}
                <div className="flex gap-2 items-center">
                    <span className="text-gray-400 text-sm font-medium mr-2">Tags:</span>
                    <button
                        onClick={() => setSelectedTag(null)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${selectedTag === null
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                    >
                        All
                    </button>
                    {['PROD', 'QA', 'TEST'].map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1 ${selectedTag === tag
                                ? tag === 'PROD' ? 'bg-red-600 text-white' : tag === 'QA' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${tag === 'PROD' ? 'bg-red-300' : tag === 'QA' ? 'bg-amber-200' : 'bg-emerald-300'}`}></span>
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Secrets Grid */}
            {filteredSecrets.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">🔐</div>
                    <p className="text-xl">No secrets found</p>
                    <p className="text-sm mt-2">Click "Add Secret" to create your first credential</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {filter === 'all' ? (
                        <>
                            {(['database', 'sftp', 'website'] as SecretType[]).map(type => {
                                const groupSecrets = filteredSecrets.filter(s => s.type === type);
                                if (groupSecrets.length === 0) return null;
                                return (
                                    <div key={type} className="animate-fade-in">
                                        <div className="flex items-center gap-3 mb-4 border-b border-gray-700/50 pb-2">
                                            <span className="text-xl">
                                                {type === 'database' ? '🗄️' : type === 'sftp' ? '📁' : '🌐'}
                                            </span>
                                            <h2 className="text-lg font-bold text-gray-300 uppercase tracking-wider">
                                                {type}s
                                            </h2>
                                            <span className="bg-gray-700 text-gray-400 px-2 py-0.5 rounded text-xs font-mono">
                                                {groupSecrets.length}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {groupSecrets.map((secret) => (
                                                <SecretCard
                                                    key={secret.id}
                                                    secret={secret}
                                                    onEdit={() => {
                                                        setEditingSecret(secret);
                                                        setIsModalReadOnly(false);
                                                        setShowForm(true);
                                                    }}
                                                    onOpenReadMode={() => {
                                                        setEditingSecret(secret);
                                                        setIsModalReadOnly(true);
                                                        setShowForm(true);
                                                    }}
                                                    onDelete={() => handleDeleteSecret(secret.id)}
                                                    onCopyPassword={() => handleCopyPassword(secret)}
                                                    onCopyConnectionString={() => handleCopyConnectionString(secret)}
                                                    onLaunchWebsite={() => handleLaunchWebsite(secret)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {filteredSecrets.map((secret) => (
                                <SecretCard
                                    key={secret.id}
                                    secret={secret}
                                    onEdit={() => {
                                        setEditingSecret(secret);
                                        setIsModalReadOnly(false);
                                        setShowForm(true);
                                    }}
                                    onOpenReadMode={() => {
                                        setEditingSecret(secret);
                                        setIsModalReadOnly(true);
                                        setShowForm(true);
                                    }}
                                    onDelete={() => handleDeleteSecret(secret.id)}
                                    onCopyPassword={() => handleCopyPassword(secret)}
                                    onCopyConnectionString={() => handleCopyConnectionString(secret)}
                                    onLaunchWebsite={() => handleLaunchWebsite(secret)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Secret Form Modal */}
            {showForm && (
                <SecretFormModal
                    secret={editingSecret}
                    initialReadOnly={isModalReadOnly}
                    onClose={() => {
                        setShowForm(false);
                        setEditingSecret(null);
                    }}
                    onSave={() => {
                        setShowForm(false);
                        setEditingSecret(null);
                        loadSecrets();
                    }}
                />
            )}
        </div>
    );
};

// Secret Card Component
interface SecretCardProps {
    secret: Secret;
    onEdit: () => void;
    onDelete: () => void;
    onCopyPassword: () => void;
    onCopyConnectionString: () => void;
    onLaunchWebsite: () => void;
    onOpenReadMode: () => void;
}

const SecretCard: React.FC<SecretCardProps> = ({
    secret,
    onEdit,
    onDelete,
    onCopyPassword,
    onCopyConnectionString,
    onLaunchWebsite,
    onOpenReadMode,
}) => {
    const getIcon = () => {
        const iconStyle = "w-7 h-7 object-contain";
        switch (secret.type) {
            case 'database':
                return <img src="/assets/vault/database.png" alt="DB" className={iconStyle} />;
            case 'sftp':
                return <img src="/assets/vault/sftp.png" alt="SFTP" className={iconStyle} />;
            case 'website':
                return <img src="/assets/vault/website.png" alt="WEB" className={iconStyle} />;
            default:
                return <span className="text-3xl">🔐</span>;
        }
    };

    const getMetadataPreview = () => {
        try {
            const metadata = JSON.parse(secret.metadata);
            if (secret.type === 'database') {
                const db = metadata as DatabaseMetadata;
                return `${db.db_type}://${db.host}:${db.port}`;
            } else if (secret.type === 'sftp') {
                const sftp = metadata as SFTPMetadata;
                return `${sftp.host}:${sftp.port}`;
            } else {
                const web = metadata as WebsiteMetadata;
                return web.url;
            }
        } catch {
            return '';
        }
    };

    const renderTags = () => {
        if (!secret.tags) return null;
        return (
            <div className="flex flex-wrap gap-1 mt-2">
                {secret.tags.split(',').filter((t: string) => t).map((tag: string) => {
                    const tagStyle = tag === 'PROD' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        tag === 'QA' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                    return (
                        <span key={tag} className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${tagStyle}`}>
                            {tag}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            onClick={onOpenReadMode}
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-500 transition-all group shadow hover:shadow-xl cursor-pointer hover:bg-gray-750"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gray-900/50 rounded group-hover:bg-gray-900 transition-colors">
                        {getIcon()}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm leading-tight group-hover:text-blue-400 transition-colors">{secret.label}</h3>
                        <div className="flex flex-col">
                            {secret.username && (
                                <p className="text-gray-400 text-[11px] font-medium truncate max-w-[120px]">{secret.username}</p>
                            )}
                            {renderTags()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/40 rounded p-2 mb-3">
                <p className="text-gray-500 text-[10px] font-mono truncate">{getMetadataPreview()}</p>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-gray-700/50" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onCopyPassword}
                    className="bg-blue-600/5 hover:bg-blue-600 text-blue-400 hover:text-white py-1.5 rounded text-[9px] font-bold transition-all flex flex-col items-center justify-center gap-1 border border-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
                    title="Copy Password"
                >
                    <img src="/assets/vault/copy_premium.png" alt="" className="w-3 h-3 brightness-110" />
                    COPY
                </button>

                {secret.type === 'database' && (
                    <button
                        onClick={onCopyConnectionString}
                        className="bg-green-600/5 hover:bg-green-600 text-green-400 hover:text-white py-1.5 rounded text-[9px] font-bold transition-all flex flex-col items-center justify-center gap-1 border border-green-500/10 hover:shadow-lg hover:shadow-green-500/20 active:scale-95"
                        title="Copy Connection String"
                    >
                        <span className="text-[12px] leading-none mb-[-2px]">🔗</span>
                        URL
                    </button>
                )}

                {secret.type === 'website' && (
                    <button
                        onClick={onLaunchWebsite}
                        className="bg-purple-600/5 hover:bg-purple-600 text-purple-400 hover:text-white py-1.5 rounded text-[9px] font-bold transition-all flex flex-col items-center justify-center gap-1 border border-purple-500/10 hover:shadow-lg hover:shadow-purple-500/20 active:scale-95"
                        title="Launch Website"
                    >
                        <span className="text-[12px] leading-none mb-[-2px]">🚀</span>
                        OPEN
                    </button>
                )}

                {secret.type === 'sftp' && (
                    <div className="bg-gray-800/50 rounded flex items-center justify-center border border-gray-700/30">
                        {/* Empty spacer for SFTP to keep 4-col grid layout consistent */}
                    </div>
                )}

                <button
                    onClick={onEdit}
                    className="bg-gray-700/30 hover:bg-gray-600 text-gray-300 hover:text-white py-1.5 rounded text-[9px] font-bold transition-all flex flex-col items-center justify-center gap-1 border border-gray-600/20 hover:border-blue-500/50 active:scale-95"
                    title="Edit Secret"
                >
                    <img src="/assets/vault/edit_premium.png" alt="" className="w-3 h-3" />
                    EDIT
                </button>

                <button
                    onClick={onDelete}
                    className="bg-red-600/5 hover:bg-red-600 text-red-500 hover:text-white py-1.5 rounded text-[9px] font-bold transition-all flex flex-col items-center justify-center gap-1 border border-red-500/10 hover:border-red-500/50 active:scale-95"
                    title="Delete Secret"
                >
                    <img src="/assets/vault/delete_premium.png" alt="" className="w-3 h-3" />
                    DEL
                </button>
            </div>
        </div>
    );
};

// Secret Form Modal Component (simplified - will create full version next)
interface SecretFormModalProps {
    secret: Secret | null;
    onClose: () => void;
    onSave: () => void;
    initialReadOnly?: boolean;
}

const SecretFormModal: React.FC<SecretFormModalProps> = ({ secret, onClose, onSave, initialReadOnly = false }) => {
    const [type, setType] = useState<SecretType>(secret?.type || 'database');
    const [label, setLabel] = useState(secret?.label || '');
    const [username, setUsername] = useState(secret?.username || '');
    const [password, setPassword] = useState(secret?.password || '');
    const [notes, setNotes] = useState(secret?.notes || '');
    const [tags, setTags] = useState<string>(secret?.tags || '');
    const [showPassword, setShowPassword] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(initialReadOnly && !!secret);

    // Type-specific fields
    const [dbHost, setDbHost] = useState('');
    const [dbPort, setDbPort] = useState('5432');
    const [dbType, setDbType] = useState<'postgresql' | 'mysql' | 'oracle' | 'mssql'>('postgresql');
    const [dbName, setDbName] = useState('');
    const [sftpHost, setSftpHost] = useState('');
    const [sftpPort, setSftpPort] = useState('22');
    const [sftpUrl, setSftpUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    // Keyboard listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Load existing secret data
    useEffect(() => {
        if (secret) {
            try {
                const metadata = JSON.parse(secret.metadata);
                if (secret.type === 'database') {
                    setDbHost(metadata.host || '');
                    setDbPort(String(metadata.port || 5432));
                    setDbType(metadata.db_type || 'postgresql');
                    setDbName(metadata.database || metadata.sid || '');
                } else if (secret.type === 'sftp') {
                    setSftpHost(metadata.host || '');
                    setSftpPort(String(metadata.port || 22));
                    setSftpUrl(metadata.url || '');
                } else if (secret.type === 'website') {
                    setWebsiteUrl(metadata.url || '');
                }
            } catch (error) {
                console.error('Failed to parse metadata:', error);
            }
        }
    }, [secret]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let metadata = {};
        if (type === 'database') {
            metadata = {
                host: dbHost,
                port: parseInt(dbPort),
                db_type: dbType,
                database: dbName,
            };
        } else if (type === 'sftp') {
            metadata = {
                host: sftpHost,
                port: parseInt(sftpPort),
                url: sftpUrl,
            };
        } else if (type === 'website') {
            metadata = {
                url: websiteUrl,
            };
        }

        const secretData: CreateSecret = {
            type,
            label,
            metadata: JSON.stringify(metadata),
            tags: tags || "",
            username: username || null,
            password,
            notes: notes || null,
        };

        try {
            const url = secret ? `${API_BASE}/vault/secrets/${secret.id}` : `${API_BASE}/vault/secrets`;
            const method = secret ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(secretData),
            });

            if (response.ok) {
                onSave();
            } else {
                const error = await response.json();
                alert(`Failed to save secret: ${error.detail}`);
            }
        } catch (error) {
            console.error('Failed to save secret:', error);
            alert('Failed to save secret');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-6">
                    {secret ? 'Edit Secret' : 'Add New Secret'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type Selector */}
                    <div>
                        <label className="block text-gray-300 mb-2">Type</label>
                        <div className="flex gap-2">
                            {(['database', 'sftp', 'website'] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    disabled={isReadOnly || !!secret}
                                    className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${type === t
                                        ? 'bg-blue-600 border-blue-500 text-white'
                                        : `bg-gray-700/50 border-gray-600 text-gray-400 ${isReadOnly || !!secret ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 hover:text-gray-200'}`
                                        }`}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Label */}
                    <div>
                        <label className="block text-gray-300 mb-2">Label *</label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            required
                            disabled={isReadOnly}
                            className={`w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'opacity-70 cursor-default' : ''}`}
                            placeholder="e.g., Production Database"
                        />
                    </div>

                    {/* Tags Selection */}
                    <div>
                        <label className="block text-gray-300 mb-2 font-medium">Environment Tag</label>
                        <div className="flex gap-2">
                            {['PROD', 'QA', 'TEST'].map(t => {
                                const isSelected = tags === t;
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        disabled={isReadOnly}
                                        onClick={() => {
                                            if (isSelected) {
                                                setTags(''); // Deselect if already selected
                                            } else {
                                                setTags(t); // Select new tag (mutually exclusive)
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 border ${isSelected
                                            ? t === 'PROD' ? 'bg-red-600 border-red-500 text-white shadow-lg' : t === 'QA' ? 'bg-amber-500 border-amber-400 text-white shadow-lg' : 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                                            : `bg-gray-700/50 border-gray-600 text-gray-400 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 hover:text-gray-200'}`
                                            }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : t === 'PROD' ? 'bg-red-300' : t === 'QA' ? 'bg-amber-200' : 'bg-emerald-300'}`}></span>
                                        {t}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Type-specific fields */}
                    {type === 'database' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-2">Host *</label>
                                    <input
                                        type="text"
                                        value={dbHost}
                                        onChange={(e) => setDbHost(e.target.value)}
                                        required
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">Port *</label>
                                    <input
                                        type="number"
                                        value={dbPort}
                                        onChange={(e) => setDbPort(e.target.value)}
                                        required
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-2">Database Type *</label>
                                    <select
                                        value={dbType}
                                        onChange={(e) => setDbType(e.target.value as any)}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="postgresql">PostgreSQL</option>
                                        <option value="mysql">MySQL</option>
                                        <option value="oracle">Oracle</option>
                                        <option value="mssql">SQL Server</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">Database Name *</label>
                                    <input
                                        type="text"
                                        value={dbName}
                                        onChange={(e) => setDbName(e.target.value)}
                                        required
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {type === 'sftp' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-2">Host *</label>
                                    <input
                                        type="text"
                                        value={sftpHost}
                                        onChange={(e) => setSftpHost(e.target.value)}
                                        required
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">Port *</label>
                                    <input
                                        type="number"
                                        value={sftpPort}
                                        onChange={(e) => setSftpPort(e.target.value)}
                                        required
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2">URL (optional)</label>
                                <input
                                    type="text"
                                    value={sftpUrl}
                                    onChange={(e) => setSftpUrl(e.target.value)}
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="sftp://example.com/path"
                                />
                            </div>
                        </>
                    )}

                    {type === 'website' && (
                        <div>
                            <label className="block text-gray-300 mb-2">URL *</label>
                            <input
                                type="text"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                required
                                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://example.com/login"
                            />
                        </div>
                    )}

                    {/* Username */}
                    <div>
                        <label className="block text-gray-300 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-gray-300 mb-2">Password *</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                            />
                            <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-gray-300 mb-2">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            disabled={isReadOnly}
                            className={`w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'opacity-70 cursor-default' : ''}`}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        {isReadOnly ? (
                            <button
                                type="button"
                                onClick={() => setIsReadOnly(false)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-blue-500/20 active:scale-95"
                            >
                                <img src="/assets/vault/edit_premium.png" alt="" className="w-5 h-5 brightness-0 invert" />
                                Edit Secret
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all font-medium shadow-lg hover:shadow-blue-500/20 active:scale-95"
                            >
                                {secret ? 'Update' : 'Create'} Secret
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all font-medium border border-gray-600/50 active:scale-95"
                        >
                            {isReadOnly ? 'Close' : 'Cancel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Vault;
