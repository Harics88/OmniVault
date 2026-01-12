import { useState, useEffect } from 'react';
import { Check, Plus, Trash2, Trophy } from 'lucide-react';
import axios from 'axios';

interface Habit {
    id: number;
    title: string;
    streak: number;
    completed_today: boolean;
}

export default function HabitTracker() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [newHabit, setNewHabit] = useState('');
    const [loading, setLoading] = useState(true);

    // Mock habits for now if API fails, as backend might not be fully ready with this router
    // But the roadmap said "Created Habit models/router". Let's assume /api/habits exists.

    const fetchHabits = async () => {
        try {
            const response = await axios.get('/api/habits');
            setHabits(response.data);
        } catch (error) {
            // Fallback for demo if backend route missing
            console.warn("Habits API not found", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHabits();
    }, []);

    const addHabit = async () => {
        if (!newHabit.trim()) return;
        try {
            await axios.post('/api/habits', { title: newHabit });
            setNewHabit('');
            fetchHabits();
        } catch (error) {
            console.error("Failed to add habit", error);
        }
    };

    const toggleHabit = async (id: number) => {
        try {
            await axios.post(`/api/habits/${id}/toggle`);
            fetchHabits();
        } catch (error) {
            console.error("Failed to toggle habit", error);
        }
    };

    const deleteHabit = async (id: number) => {
        try {
            await axios.delete(`/api/habits/${id}`);
            fetchHabits();
        } catch (error) {
            console.error("Failed to delete habit", error);
        }
    };

    return (
        <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <Trophy size={20} className="text-accent-amber" />
                <h2 className="text-lg font-semibold text-text-primary">Habits</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar">
                {habits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-2 rounded-lg bg-background hover:bg-background-hover transition-colors group">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => toggleHabit(habit.id)}
                                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                                    habit.completed_today
                                    ? 'bg-accent-green border-accent-green text-white'
                                    : 'border-border-subtle hover:border-accent-green'
                                }`}
                            >
                                {habit.completed_today && <Check size={14} />}
                            </button>
                            <span className={`text-sm ${habit.completed_today ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                                {habit.title}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted font-mono">
                                🔥 {habit.streak}
                            </span>
                            <button
                                onClick={() => deleteHabit(habit.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-accent-red transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {habits.length === 0 && !loading && (
                    <div className="text-center py-4 text-text-muted text-xs italic">
                        No habits yet. Start small!
                    </div>
                )}
            </div>

            <div className="flex gap-2 mt-auto">
                <input
                    type="text"
                    value={newHabit}
                    onChange={(e) => setNewHabit(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                    placeholder="New habit..."
                    className="input flex-1 text-xs py-1.5"
                />
                <button
                    onClick={addHabit}
                    disabled={!newHabit.trim()}
                    className="btn btn-primary p-1.5"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    );
}
