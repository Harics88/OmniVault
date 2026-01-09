import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, HardDrive, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export default function Settings() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [enablePersonal, setEnablePersonal] = useState(() => {
        return localStorage.getItem('enablePersonalTasks') === 'true';
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/system/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch system stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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

                <div className="bg-background-card/50 border border-border border-dashed rounded-xl p-6 text-center">
                    <p className="text-text-muted italic">More configuration options coming in future updates.</p>
                </div>
            </div>
        </div>
    );
}
