import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, HardDrive, ShieldCheck, Download, Upload } from 'lucide-react';
import axios from 'axios';

export default function Settings() {
    const [enablePersonal, setEnablePersonal] = useState(() => {
        return localStorage.getItem('enablePersonalTasks') === 'true';
    });
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial stats fetch removed as 'stats' and 'loading' were unused in UI logic
    // (though 'loading' was used for initial state, but stats data wasn't displayed in this component yet)
    // If we want to show stats, we should use them. For now, cleaning up unused code.

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await axios.get('http://localhost:8000/api/data/export', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `omnivault_backup_${new Date().toISOString().slice(0, 10)}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please check console for details.');
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

        if (!confirm("WARNING: This will replace all your current data with the backup. This action cannot be undone. Are you sure?")) {
            return;
        }

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post('http://localhost:8000/api/data/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Import successful! The application needs to restart to apply changes.');
            window.location.reload();
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Please check console for details.');
        } finally {
            setIsImporting(false);
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
                        <HardDrive size={20} className="text-accent-blue" />
                        <h2 className="text-xl font-semibold text-text-primary">Data Management</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-background border border-border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Download size={20} className="text-accent-green" />
                                <span className="font-semibold text-text-primary">Backup Data</span>
                            </div>
                            <p className="text-xs text-text-muted mb-4">
                                Download a full copy of your database (tasks, notes, settings) as a ZIP file.
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
                </section>
            </div>
        </div>
    );
}
