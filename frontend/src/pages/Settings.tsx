import React, { useState, useRef, useEffect } from 'react';
import { Settings as SettingsIcon, HardDrive, ShieldCheck, Upload, FileJson } from 'lucide-react';
import axios from 'axios';
import { loadWidgetConfig, saveWidgetConfig, WidgetConfig } from '../utils/widgetConfig';
import { Eye, EyeOff, Layout as LayoutIcon } from 'lucide-react';
import PINEntry from '../components/PINEntry';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { systemApi } from '../lib/api';

export default function Settings() {
    const [enablePersonal, setEnablePersonal] = useState(() => {
        return localStorage.getItem('enablePersonalTasks') === 'true';
    });
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [widgets, setWidgets] = useState<WidgetConfig[]>(loadWidgetConfig());
    const [vaultPinEnabled, setVaultPinEnabled] = useState(true);
    const [pinPromptMode, setPinPromptMode] = useState<'verify' | 'setup' | null>(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const toggleWidget = (id: string) => {
        const updated = widgets.map(w =>
            w.id === id ? { ...w, enabled: !w.enabled } : w
        );
        setWidgets(updated);
        saveWidgetConfig(updated);
        const widget = updated.find(w => w.id === id);
        showToast(`${widget?.enabled ? '👁️' : '🙈'} ${widget?.title} ${widget?.enabled ? 'enabled' : 'disabled'}`);
    };

    useEffect(() => {
        const fetchVaultStatus = async () => {
            try {
                const response = await axios.get('/api/vault/pin/status');
                setVaultPinEnabled(response.data.is_enabled);
            } catch (error) {
                console.error('Failed to fetch vault status:', error);
            }
        };
        fetchVaultStatus();
    }, []);

    // Initial stats fetch removed as 'stats' and 'loading' were unused in UI logic
    // (though 'loading' was used for initial state, but stats data wasn't displayed in this component yet)
    // If we want to show stats, we should use them. For now, cleaning up unused code.

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = await systemApi.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `mytasker_export_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('✅ Data exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            showToast('❌ Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setPendingFile(file);
        setShowRestoreConfirm(true);
    };

    const confirmRestore = async () => {
        if (!pendingFile) return;
        const file = pendingFile;

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post('/api/data/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Import successful! The application needs to restart to apply changes.');
            window.location.reload();
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Please check console for details.');
        } finally {
            setIsImporting(false);
            setPendingFile(null);
            setShowRestoreConfirm(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-accent-blue/10 rounded-xl">
                    <SettingsIcon size={32} className="text-accent-blue" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
                    <p className="text-text-muted">Manage your application preferences and data</p>
                </div>
            </div>

            <div className="space-y-6">
                <section className="bg-background-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <SettingsIcon size={20} className="text-accent-blue" />
                        <h2 className="text-xl font-semibold text-text-primary">General</h2>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                        <div>
                            <div className="text-base font-semibold text-text-primary">Enable Personal Tasks</div>
                            <p className="text-sm text-text-muted">Separate your personal life from work tasks</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={enablePersonal}
                                onChange={(e) => {
                                    setEnablePersonal(e.target.checked);
                                    localStorage.setItem('enablePersonalTasks', String(e.target.checked));
                                    showToast(e.target.checked ? '👤 Personal Tasks mode enabled' : '💼 Work Tasks mode enabled');
                                    // Trigger storage event for other components to react immediately if needed
                                    window.dispatchEvent(new Event('storage'));
                                }}
                            />
                            <div className="w-11 h-6 bg-background-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"></div>
                        </label>
                    </div>

                </section>

                <section className="bg-background-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <LayoutIcon size={20} className="text-accent-blue" />
                        <h2 className="text-xl font-semibold text-text-primary">Dashboard Widgets</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {widgets.map(widget => (
                            <div key={widget.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                                <span className="text-sm font-medium text-text-primary">{widget.title}</span>
                                <button
                                    onClick={() => toggleWidget(widget.id)}
                                    className={`p-2 rounded-lg transition-colors ${widget.enabled
                                        ? 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20'
                                        : 'bg-background-elevated text-text-muted hover:bg-border'
                                        }`}
                                    title={widget.enabled ? 'Hide Widget' : 'Show Widget'}
                                >
                                    {widget.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-background-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <HardDrive size={20} className="text-accent-blue" />
                        <h2 className="text-xl font-semibold text-text-primary">Data Management</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-background border border-border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <FileJson size={20} className="text-accent-blue" />
                                <span className="font-semibold text-text-primary">Export JSON</span>
                            </div>
                            <p className="text-xs text-text-muted mb-4">
                                Download all your tasks, notes, snippets, and history as a readable JSON file.
                            </p>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full py-2 px-4 bg-accent-green/10 text-accent-green hover:bg-accent-green/20 rounded-lg text-sm font-medium transition-colors"
                            >
                                {isExporting ? 'Exporting...' : 'Export Data'}
                            </button>
                        </div>

                        <div className="p-4 bg-background border border-border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Upload size={20} className="text-accent-amber" />
                                <span className="font-semibold text-text-primary">Restore Data</span>
                            </div>
                            <p className="text-xs text-text-muted mb-4">
                                Restore from a backup ZIP file. ⚠️ This will replace all current data.
                            </p>
                            <input
                                type="file"
                                accept=".zip"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button
                                onClick={handleImportClick}
                                disabled={isImporting}
                                className="w-full py-2 px-4 bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20 rounded-lg text-sm font-medium transition-colors"
                            >
                                {isImporting ? 'Importing...' : 'Import Data'}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="bg-background-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck size={20} className="text-accent-blue" />
                        <h2 className="text-xl font-semibold text-text-primary">Privacy & Security</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                            <div>
                                <div className="text-base font-semibold text-text-primary">Vault PIN Protection</div>
                                <p className="text-sm text-text-muted">Require a 4-digit PIN to access your stored credentials</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={vaultPinEnabled}
                                    onChange={(e) => {
                                        const enabled = e.target.checked;
                                        if (!enabled) {
                                            // Disabling protection requires PIN verification
                                            setPinPromptMode('verify');
                                        } else {
                                            // Enabling protection forces new PIN setup
                                            setPinPromptMode('setup');
                                        }
                                    }}
                                />
                                <div className="w-11 h-6 bg-background-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"></div>
                            </label>
                        </div>

                        <div className="p-4 bg-background border border-border rounded-lg">
                            <div className="flex items-center gap-2 text-text-muted mb-1">
                                <ShieldCheck size={16} />
                                <span className="text-sm font-medium">Data Privacy</span>
                            </div>
                            <div className="text-lg font-semibold text-text-primary">
                                Local-Only Storage
                            </div>
                            <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                Your data never leaves this machine. All notes, tasks, and settings are stored in a secure local database (SQLite) within your private environment.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-background-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <SettingsIcon size={20} className="text-accent-blue" />
                        <h2 className="text-xl font-semibold text-text-primary">Keyboard Shortcuts</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-4 bg-background border border-border rounded-lg">
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Navigation (Chords)</h3>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary">Go Home</span> <kbd className="kbd text-[10px]">G H</kbd></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary">Daily Log</span> <kbd className="kbd text-[10px]">G D</kbd></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary">Notes</span> <kbd className="kbd text-[10px]">G N</kbd></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary">Tasks</span> <kbd className="kbd text-[10px]">G T</kbd></div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Global Actions</h3>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary">Command Palette</span> <kbd className="kbd text-[10px]">Ctrl K</kbd></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary">Quick Search</span> <kbd className="kbd text-[10px]">/</kbd></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary">Jump to Today</span> <kbd className="kbd text-[10px]">Alt D</kbd></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary">Help</span> <kbd className="kbd text-[10px]">?</kbd></div>
                        </div>
                    </div>
                </section>
            </div>


            {pinPromptMode && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-sm">
                        <PINEntry
                            mode={pinPromptMode}
                            onSuccess={async () => {
                                if (pinPromptMode === 'verify') {
                                    try {
                                        await axios.post('/api/vault/pin/toggle?enabled=false');
                                        setVaultPinEnabled(false);
                                        setPinPromptMode(null);
                                        showToast('🔓 Vault protection disabled');
                                    } catch (error) {
                                        console.error('Failed to disable vault PIN:', error);
                                        setVaultPinEnabled(true);
                                    }
                                } else if (pinPromptMode === 'setup') {
                                    try {
                                        await axios.post('/api/vault/pin/toggle?enabled=true');
                                        setVaultPinEnabled(true);
                                        setPinPromptMode(null);
                                        showToast('🔒 Vault protection enabled');
                                    } catch (error) {
                                        console.error('Failed to enable vault PIN:', error);
                                        setVaultPinEnabled(false);
                                    }
                                }
                            }}
                            onCancel={() => setPinPromptMode(null)}
                        />
                    </div>
                </div>
            )}

            {/* Restore Confirmation */}
            <ConfirmModal
                isOpen={showRestoreConfirm}
                onClose={() => {
                    setShowRestoreConfirm(false);
                    setPendingFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                onConfirm={confirmRestore}
                title="Restore Data"
                message="WARNING: This will replace all your current data with the backup. This action cannot be undone. Are you sure?"
                confirmText="Restore All Data"
            />

            {/* Version Info */}
            <div className="mt-8 pt-6 border-t border-gray-700/50 text-center">
                <p className="text-gray-500 text-sm">
                    Omni Vault <span className="text-gray-400 font-medium">v2.5.0</span>
                </p>
                <p className="text-gray-600 text-xs mt-1">
                    Manage. Code. Secure. Create.
                </p>
            </div>
        </div>
    );
}
