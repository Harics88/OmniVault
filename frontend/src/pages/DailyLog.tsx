import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays, parseISO, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Save, Clock, Loader2, Edit, Check, ChevronDown, Search, X } from 'lucide-react';
import { dailyLogsApi } from '../lib/api';
import RichTextEditor from '../components/RichTextEditor';
import Calendar from '../components/Calendar';
import type { DailyLog } from '../types';

// Helper function to strip HTML tags from preview text
function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&amp;/g, '&')  // Replace &amp; with &
        .replace(/&lt;/g, '<')   // Replace &lt; with <
        .replace(/&gt;/g, '>')   // Replace &gt; with >
        .replace(/&quot;/g, '"') // Replace &quot; with "
        .replace(/\s+/g, ' ')    // Collapse multiple spaces
        .trim();
}

export default function DailyLog() {
    const { date: dateParam } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const calendarRef = useRef<HTMLDivElement>(null);

    // Current date
    const currentDate = dateParam ? parseISO(dateParam) : new Date();
    const dateString = format(currentDate, 'yyyy-MM-dd');

    // Local state
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isEditable, setIsEditable] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState<DailyLog[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [prevDate, setPrevDate] = useState(dateString);
    const originalContentRef = useRef('');
    const searchRef = useRef<HTMLDivElement>(null);

    // Reset content immediately when date changes to prevent stale data flash
    if (dateString !== prevDate) {
        setPrevDate(dateString);
        setContent('');
        setIsEditable(false);
    }

    // Fetch log for current date
    const { data: log, isLoading } = useQuery({
        queryKey: ['daily-log', dateString],
        queryFn: () => dailyLogsApi.getByDate(dateString),
    });

    // Fetch dates with logs
    const { data: logDates = [] } = useQuery({
        queryKey: ['daily-log-dates'],
        queryFn: () => dailyLogsApi.getDates(),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (newContent: string) => dailyLogsApi.updateByDate(dateString, newContent),
        onSuccess: () => {
            setLastSaved(new Date());
            setIsSaving(false);
            queryClient.invalidateQueries({ queryKey: ['daily-log'] });
            queryClient.invalidateQueries({ queryKey: ['daily-log-dates'] });
        },
        onError: () => {
            setIsSaving(false);
        },
    });

    // Initialize content from log
    // Initialize content from log
    useEffect(() => {
        if (log) {
            console.log('[DailyLog] Received log data:', log.content);
            setContent(log.content);
        }
    }, [log]);

    // Click outside handler for calendar and search
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (showCalendar && calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
            if (showSearch && searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearch(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCalendar, showSearch]);

    // Search effect
    useEffect(() => {
        if (!showSearch || searchInput.length < 2) {
            setSearchResults([]);
            return;
        }

        const fetchResults = async () => {
            setIsSearching(true);
            try {
                const results = await dailyLogsApi.getAll(0, 10, searchInput);
                setSearchResults(results);
            } catch (error) {
                console.error('Search logs error:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [searchInput, showSearch]);

    // Cancel editing
    const handleCancel = () => {
        const originalContent = originalContentRef.current;
        setContent(originalContent);

        // If content changed (possibly auto-saved), revert backend
        if (content !== originalContent) {
            updateMutation.mutate(originalContent);
        }

        setIsEditable(false);
    };

    // Manual save function
    const handleSave = () => {
        setIsSaving(true);
        updateMutation.mutate(content);
        setIsEditable(false);
    };

    // Auto-save only when editing
    useEffect(() => {
        if (!log || !isEditable) return;
        if (content === log.content) return;

        const timer = setTimeout(() => {
            setIsSaving(true);
            updateMutation.mutate(content);
        }, 2000); // Slower debounce

        return () => clearTimeout(timer);
    }, [content, isEditable]);

    // Handle editor change
    const handleEditorChange = (newContent: string) => {
        if (isEditable) {
            setContent(newContent);
        }
    };

    // Navigate to different dates
    const goToDate = (date: Date) => {
        if (isToday(date)) {
            navigate('/daily-log');
        } else {
            navigate(`/daily-log/${format(date, 'yyyy-MM-dd')}`);
        }
        setShowCalendar(false);
    };

    const goToPrevDay = () => goToDate(subDays(currentDate, 1));
    const goToNextDay = () => goToDate(addDays(currentDate, 1));

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
                        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 whitespace-nowrap shrink-0">
                            <CalendarIcon size={24} className="text-accent-blue" />
                            Daily Log
                        </h1>

                        {/* Date Navigation */}
                        <div
                            ref={calendarRef}
                            className="flex items-center gap-1 bg-background-card rounded-lg p-1 relative"
                        >
                            <button
                                onClick={goToPrevDay}
                                className="p-2 hover:bg-background-hover rounded-md transition-colors"
                            >
                                <ChevronLeft size={18} className="text-text-muted" />
                            </button>

                            <button
                                onClick={() => setShowCalendar(!showCalendar)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${showCalendar ? 'bg-background-hover text-text-primary' : 'text-text-secondary hover:bg-background-hover'}`}
                            >
                                <span>{isToday(currentDate) ? 'Today' : format(currentDate, 'MMM d, yyyy')}</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${showCalendar ? 'rotate-180' : ''}`} />
                            </button>

                            {showCalendar && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[100]">
                                    <Calendar
                                        selectedDate={currentDate}
                                        onSelectDate={goToDate}
                                        onClose={() => setShowCalendar(false)}
                                        datesWithLogs={logDates}
                                    />
                                </div>
                            )}

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

                        {/* Search Bar */}
                        <div ref={searchRef} className="relative ml-4 w-64 hidden md:block">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-blue transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    value={searchInput}
                                    onChange={(e) => {
                                        setSearchInput(e.target.value);
                                        if (e.target.value) setShowSearch(true);
                                    }}
                                    onFocus={() => setShowSearch(true)}
                                    className="w-full bg-background border border-border rounded-lg pl-9 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-all"
                                />
                                {searchInput && (
                                    <button
                                        onClick={() => {
                                            setSearchInput('');
                                            setShowSearch(false);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-background-hover rounded"
                                    >
                                        <X size={14} className="text-text-muted" />
                                    </button>
                                )}
                            </div>

                            {showSearch && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-background-card rounded-xl shadow-elevated border border-border overflow-hidden z-[100] animate-slide-up w-80">
                                    <div className="max-h-64 overflow-y-auto">
                                        {isSearching ? (
                                            <div className="p-4 text-center">
                                                <Loader2 size={16} className="animate-spin text-accent-blue mx-auto" />
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map(result => (
                                                <button
                                                    key={result.id}
                                                    onClick={() => {
                                                        goToDate(parseISO(result.date));
                                                        setShowSearch(false);
                                                        setSearchInput('');
                                                    }}
                                                    className="w-full p-3 text-left hover:bg-background-hover border-b border-border/50 last:border-0"
                                                >
                                                    <div className="text-sm font-medium text-text-primary">
                                                        {format(parseISO(result.date), 'MMMM d, yyyy')}
                                                    </div>
                                                    <div className="text-xs text-text-muted truncate mt-1">
                                                        {stripHtml(result.content)}
                                                    </div>
                                                </button>
                                            ))
                                        ) : searchInput.length >= 2 ? (
                                            <div className="p-4 text-center text-xs text-text-muted">
                                                No results found
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-xs text-text-muted">
                                                Type at least 2 characters to search
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Save Status */}
                    <div className="flex items-center gap-3 text-sm shrink-0 ml-4">
                        <div className="flex items-center gap-2 whitespace-nowrap min-w-[150px] justify-end">
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

                        {/* Edit/Save Toggle */}
                        {!isEditable ? (
                            <button
                                onClick={() => {
                                    originalContentRef.current = content;
                                    setIsEditable(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-all font-medium whitespace-nowrap shadow-sm active:scale-95"
                            >
                                <Edit size={16} />
                                <span>Edit Log</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-text-muted hover:text-text-primary hover:bg-background-hover rounded-lg transition-colors font-medium whitespace-nowrap"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-all font-medium whitespace-nowrap shadow-sm active:scale-95"
                                >
                                    <Check size={16} />
                                    <span>Save & Done</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Editor */}
            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="w-full h-full flex flex-col">
                    <div className="flex-1 min-h-[500px] h-full">
                        <RichTextEditor
                            key={dateString}
                            content={content}
                            onChange={handleEditorChange}
                            isEditable={isEditable}
                            placeholder="Start writing your thoughts for today... You can paste images, add links, and format text."
                        />
                    </div>

                    {/* Editor Footer */}
                    <div className="mt-4 flex items-center justify-between text-xs text-text-muted shrink-0">
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
