import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays, parseISO, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Save, Clock, Loader2 } from 'lucide-react';
import { dailyLogsApi } from '../lib/api';
import RichTextEditor from '../components/RichTextEditor';

export default function DailyLog() {
    const { date: dateParam } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Current date
    const currentDate = dateParam ? parseISO(dateParam) : new Date();
    const dateString = format(currentDate, 'yyyy-MM-dd');

    // Local state
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Fetch log for current date
    const { data: log, isLoading } = useQuery({
        queryKey: ['daily-log', dateString],
        queryFn: () => dailyLogsApi.getByDate(dateString),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (newContent: string) => dailyLogsApi.updateByDate(dateString, newContent),
        onSuccess: () => {
            setLastSaved(new Date());
            setIsSaving(false);
            queryClient.invalidateQueries({ queryKey: ['daily-log'] });
        },
        onError: () => {
            setIsSaving(false);
        },
    });

    // Initialize content from log
    useEffect(() => {
        if (log) {
            setContent(log.content);
        }
    }, [log]);

    // Auto-save with debounce
    useEffect(() => {
        if (!log) return;
        if (content === log.content) return;

        setIsSaving(true);
        const timer = setTimeout(() => {
            updateMutation.mutate(content);
        }, 1000);

        return () => clearTimeout(timer);
    }, [content]);

    // Handle editor change
    const handleEditorChange = (newContent: string) => {
        setContent(newContent);
    };

    // Navigate to different dates
    const goToDate = (date: Date) => {
        if (isToday(date)) {
            navigate('/daily-log');
        } else {
            navigate(`/daily-log/${format(date, 'yyyy-MM-dd')}`);
        }
    };

    const goToPrevDay = () => goToDate(subDays(currentDate, 1));
    const goToNextDay = () => goToDate(addDays(currentDate, 1));
    const goToToday = () => goToDate(new Date());

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Sticky Header */}
            <header className="sticky top-0 z-10 bg-background border-b border-border px-8 py-4">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                            <Calendar size={24} className="text-accent-blue" />
                            Daily Log
                        </h1>

                        {/* Date Navigation */}
                        <div className="flex items-center gap-1 bg-background-card rounded-lg p-1">
                            <button
                                onClick={goToPrevDay}
                                className="p-2 hover:bg-background-hover rounded-md transition-colors"
                            >
                                <ChevronLeft size={18} className="text-text-muted" />
                            </button>

                            <button
                                onClick={goToToday}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isToday(currentDate)
                                    ? 'bg-accent-blue text-white'
                                    : 'text-text-secondary hover:bg-background-hover'
                                    }`}
                            >
                                {isToday(currentDate) ? 'Today' : format(currentDate, 'MMM d, yyyy')}
                            </button>

                            <button
                                onClick={goToNextDay}
                                className="p-2 hover:bg-background-hover rounded-md transition-colors"
                                disabled={isToday(currentDate)}
                            >
                                <ChevronRight
                                    size={18}
                                    className={isToday(currentDate) ? 'text-text-muted/30' : 'text-text-muted'}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Save Status */}
                    <div className="flex items-center gap-2 text-sm">
                        {isSaving ? (
                            <>
                                <Loader2 size={14} className="animate-spin text-accent-blue" />
                                <span className="text-text-muted">Saving...</span>
                            </>
                        ) : lastSaved ? (
                            <>
                                <Save size={14} className="text-accent-green" />
                                <span className="text-text-muted">
                                    Saved {format(lastSaved, 'h:mm a')}
                                </span>
                            </>
                        ) : (
                            <>
                                <Clock size={14} className="text-text-muted" />
                                <span className="text-text-muted">Auto-save enabled</span>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Editor */}
            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="min-h-[calc(100vh-250px)]">
                        <RichTextEditor
                            content={content}
                            onChange={handleEditorChange}
                            placeholder="Start writing your thoughts for today... You can paste images, add links, and format text."
                        />
                    </div>

                    {/* Editor Footer */}
                    <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
                        <div className="flex items-center gap-4">
                            <span>
                                <kbd className="kbd">Ctrl+B</kbd> Bold
                            </span>
                            <span>
                                <kbd className="kbd">Ctrl+I</kbd> Italic
                            </span>
                            <span>
                                <kbd className="kbd">Ctrl+K</kbd> Link
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Images & Links supported</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Remove LinkMenu component as it's no longer used



