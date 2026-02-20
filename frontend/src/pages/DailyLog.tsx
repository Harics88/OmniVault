import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { isToday as checkIsToday, subDays, addDays, parseISO } from 'date-fns';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Search,
    Plus,
    Filter,
    X
} from 'lucide-react';
import { dailyLogsApi, logEntriesApi, entitiesApi } from '../lib/api';
import { EntryComposer } from '../components/EntryComposer';
const CalendarPicker = lazy(() => import('../components/Calendar'));
import { EntryRow } from '../components/EntryRow';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import type { DailyLog as DailyLogType, LogEntry, CreateLogEntry, UpdateLogEntry } from '../types';
import { parseServerDate, formatDisplayDate, formatISO } from '../utils/date';

// Custom hook for debouncing a value
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

export default function DailyLog() {
    const { date: dateParam } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    // Current date
    const currentDate = dateParam ? parseServerDate(dateParam) : new Date();
    const dateString = formatISO(currentDate);
    const isToday = checkIsToday(currentDate);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebouncedValue(searchQuery, 300);
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [pageLimit, setPageLimit] = useState(100);
    const [showCalendar, setShowCalendar] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Determine if we're in search mode (cross-day search)
    const isSearchMode = debouncedSearch.length > 0;

    // Close calendar on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
                setShowCalendar(false);
            }
        };
        if (showCalendar) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showCalendar]);

    // Esc key cancels active entry edit
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && editingEntryId !== null) {
                e.preventDefault();
                setEditingEntryId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingEntryId]);

    // Fetch logs (paginated, with search support)
    const { data: allLogs = [], isLoading: allLogsLoading, isFetching } = useQuery({
        queryKey: ['daily-logs', debouncedSearch, pageLimit],
        queryFn: () => dailyLogsApi.getAll(0, debouncedSearch ? 500 : pageLimit, debouncedSearch),
        placeholderData: keepPreviousData,
    });


    // Fetch dates specifically for calendar/streak (efficient, no content)
    const { data: logDates = [] } = useQuery<string[]>({
        queryKey: ['log-dates'],
        queryFn: () => dailyLogsApi.getDates(),
    });

    // Fetch current day log specifically (ensures we have it even if not in the recent list)
    const { data: currentDayLog } = useQuery({
        queryKey: ['daily-log', dateString],
        queryFn: () => dailyLogsApi.getByDate(dateString),
        enabled: !isSearchMode,
    });

    // Fetch entities for @mention
    const { data: entities = [] } = useQuery({
        queryKey: ['entities'],
        queryFn: () => entitiesApi.getAll(),
        staleTime: 5 * 60 * 1000,
    });

    // Get dates that have log entries for calendar dots
    const datesWithLogs = logDates.map(d => typeof d === 'string' ? d : String(d));

    // Get entries - either from current day or cross-day search
    const { entries: displayEntries, searchResultDays } = useMemo(() => {
        if (isSearchMode) {
            // Cross-day search: search all logs across all days
            const query = debouncedSearch.toLowerCase();
            const results: { date: string; entries: LogEntry[] }[] = [];

            for (const log of allLogs) {
                const matchingEntries = (log.log_entries || []).filter(e =>
                    e.content.toLowerCase().includes(query)
                );
                if (matchingEntries.length > 0) {
                    results.push({
                        date: log.date,
                        entries: matchingEntries.sort((a, b) =>
                            parseServerDate(b.timestamp).getTime() - parseServerDate(a.timestamp).getTime()
                        ),
                    });
                }
            }

            // Sort days descending
            results.sort((a, b) => parseServerDate(b.date).getTime() - parseServerDate(a.date).getTime());
            return { entries: [], searchResultDays: results };
        }

        // Normal mode: show current day's entries
        // Prefer local specific query if available, fallback to list search for speed/offline
        const dayLog = currentDayLog || allLogs.find(l => l.date === dateString);
        let entries = dayLog?.log_entries || [];

        // Filter by tag
        if (tagFilter) {
            entries = entries.filter(e =>
                e.content.toLowerCase().includes(tagFilter.toLowerCase())
            );
        }

        // Sort by timestamp descending
        const sorted = [...entries].sort((a, b) =>
            parseServerDate(b.timestamp).getTime() - parseServerDate(a.timestamp).getTime()
        );

        return { entries: sorted, searchResultDays: [] };
    }, [allLogs, currentDayLog, dateString, debouncedSearch, tagFilter, isSearchMode]);

    // Extract all unique tags from current day's entries
    const allTags = useMemo(() => {
        const dayLog = currentDayLog || allLogs.find(l => l.date === dateString);
        const entries = dayLog?.log_entries || [];
        const tags = new Set<string>();
        entries.forEach(entry => {
            const matches = entry.content.match(/#\w+/g);
            if (matches) {
                matches.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags);
    }, [allLogs, currentDayLog, dateString]);

    // Create entry mutation — instantly updates cache
    const createEntryMutation = useMutation({
        mutationFn: (entry: CreateLogEntry) => logEntriesApi.create(entry),
        onSuccess: (newEntry: LogEntry) => {
            // Update specific day cache
            queryClient.setQueryData(['daily-log', newEntry.log_date], (old: any) => {
                if (!old) return old;
                return { ...old, log_entries: [...(old.log_entries || []), newEntry] };
            });

            // Update global list cache for consistency
            queryClient.setQueryData(['daily-logs', debouncedSearch, pageLimit], (old: DailyLogType[] | undefined) => {
                if (!old) return old;
                return old.map(log => {
                    if (log.date === newEntry.log_date) {
                        return { ...log, log_entries: [...(log.log_entries || []), newEntry] };
                    }
                    return log;
                });
            });

            queryClient.invalidateQueries({ queryKey: ['log-dates'] }); // Update calendar dots
            showToast('Entry posted ✓');
        },
        onError: () => {
            showToast('Failed to create entry');
        },
    });

    // Update entry mutation
    const updateEntryMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateLogEntry }) =>
            logEntriesApi.update(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: ['daily-log', dateString] });
            await queryClient.cancelQueries({ queryKey: ['daily-logs'] });

            const previousDay = queryClient.getQueryData(['daily-log', dateString]);
            const previousLogs = queryClient.getQueryData(['daily-logs', debouncedSearch, pageLimit]);

            // Optimistically update
            queryClient.setQueryData(['daily-log', dateString], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    log_entries: (old.log_entries || []).map((e: LogEntry) =>
                        e.id === id ? { ...e, ...data } : e
                    )
                };
            });

            return { previousDay, previousLogs };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousDay) {
                queryClient.setQueryData(['daily-log', dateString], context.previousDay);
            }
            if (context?.previousLogs) {
                queryClient.setQueryData(['daily-logs', debouncedSearch, pageLimit], context.previousLogs);
            }
            showToast('Failed to update entry');
        },
        onSuccess: () => {
            showToast('Entry updated ✓');
            queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
        },
    });

    // Delete entry mutation — instantly removes from cache
    const deleteEntryMutation = useMutation({
        mutationFn: (id: number) => logEntriesApi.delete(id),
        onMutate: async (deletedId: number) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['daily-logs'] });
            const previous = queryClient.getQueryData<DailyLogType[]>(['daily-logs']);

            // Optimistically remove the entry from both caches
            queryClient.setQueryData(['daily-log', dateString], (old: any) => {
                if (!old) return old;
                return { ...old, log_entries: (old.log_entries || []).filter((e: any) => e.id !== deletedId) };
            });

            queryClient.setQueryData(['daily-logs', debouncedSearch, pageLimit], (old: DailyLogType[] | undefined) => {
                if (!old) return old;
                return old.map(log => ({
                    ...log,
                    log_entries: (log.log_entries || []).filter(e => e.id !== deletedId),
                }));
            });

            return { previous };
        },
        onError: (_err, _id, context) => {
            // Roll back on error
            if (context?.previous) {
                queryClient.setQueryData(['daily-logs'], context.previous);
            }
            showToast('Failed to delete entry');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
        },
        onSuccess: () => {
            showToast('Entry deleted');
        },
    });

    // Navigate to date
    const goToDate = useCallback((date: Date) => {
        navigate(checkIsToday(date) ? '/daily-log' : `/daily-log/${formatISO(date)}`);
    }, [navigate]);

    // Handle entry actions - stabilized callbacks
    const handleEdit = useCallback(async (id: number, data: UpdateLogEntry) => {
        updateEntryMutation.mutate({ id, data });
    }, [updateEntryMutation]);

    const handleDelete = useCallback((id: number) => {
        setDeleteTarget(id);
    }, []);

    const confirmDelete = useCallback(() => {
        if (deleteTarget !== null) {
            deleteEntryMutation.mutate(deleteTarget);
            setDeleteTarget(null);
        }
    }, [deleteTarget, deleteEntryMutation]);

    const handleTagClick = useCallback((tag: string) => {
        setTagFilter(prev => prev === tag ? null : tag);
    }, []);

    const handleSubmit = useCallback(async (entry: CreateLogEntry) => {
        createEntryMutation.mutate(entry);
    }, [createEntryMutation]);

    // Loading state
    if (allLogsLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-[#0D1117]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1F6FEB]" />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#0D1117] animate-fade-in">
            {/* Centered container */}
            <div className="max-w-2xl mx-auto px-4 py-8">

                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    {/* Date navigation */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => goToDate(subDays(currentDate, 1))}
                            className="p-2 rounded-lg hover:bg-[#21262D] text-[#7D8590] hover:text-[#E6EDF3] transition-colors active:scale-90"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        {/* Clickable date that opens calendar */}
                        <div className="relative" ref={calendarRef}>
                            <button
                                onClick={() => setShowCalendar(!showCalendar)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#21262D] transition-colors"
                            >
                                <CalendarIcon size={18} className="text-[#1F6FEB]" />
                                <h1 className="text-lg font-semibold text-[#E6EDF3]">
                                    {isToday ? 'Today' : formatDisplayDate(currentDate, 'EEEE, MMM d')}
                                </h1>
                                {!isToday && (
                                    <span className="text-sm text-[#7D8590]">
                                        {formatDisplayDate(currentDate, 'yyyy')}
                                    </span>
                                )}
                            </button>

                            {/* Calendar Popup */}
                            {showCalendar && (
                                <div className="absolute top-full left-0 mt-2 z-50">
                                    <Suspense fallback={<div className="p-4 bg-background-card border border-border rounded-xl shadow-xl w-64 h-64 animate-pulse" />}>
                                        <CalendarPicker
                                            selectedDate={currentDate}
                                            onSelectDate={(date) => {
                                                goToDate(date);
                                                setShowCalendar(false);
                                            }}
                                            onClose={() => setShowCalendar(false)}
                                            datesWithLogs={datesWithLogs}
                                        />
                                    </Suspense>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => goToDate(addDays(currentDate, 1))}
                            disabled={isToday}
                            className="p-2 rounded-lg hover:bg-[#21262D] text-[#7D8590] hover:text-[#E6EDF3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-90"
                        >
                            <ChevronRight size={20} />
                        </button>

                        {!isToday && (
                            <button
                                onClick={() => goToDate(new Date())}
                                className="ml-2 px-3 py-1 rounded-full text-xs font-medium bg-[#21262D] text-[#7D8590] hover:text-[#E6EDF3] transition-colors"
                            >
                                Go to Today
                            </button>
                        )}
                    </div>

                    {/* Right side: search */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8590]" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search all days..."
                                className="w-40 pl-9 pr-3 py-2 bg-[#161B22] border border-[#30363D] rounded-lg text-sm text-[#E6EDF3] placeholder-[#7D8590] focus:border-[#1F6FEB] focus:outline-none focus:w-56 transition-all duration-300"
                            />
                        </div>
                    </div>
                </header>

                {/* Entry Composer (hidden during search) */}
                {!isSearchMode && (
                    <div className="mb-8">
                        <EntryComposer
                            date={dateString}
                            onSubmit={handleSubmit}
                            isLoading={createEntryMutation.isPending}
                            entities={entities}
                        />
                    </div>
                )}

                {/* Tag Filter Bar (only in day view) */}
                {!isSearchMode && allTags.length > 0 && (
                    <div className="mb-4 flex items-center gap-2 flex-wrap">
                        <Filter size={14} className="text-[#7D8590]" />
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => handleTagClick(tag)}
                                className={`
                                    px-2 py-1 rounded-full text-xs font-medium transition-all duration-200
                                    ${tagFilter === tag
                                        ? 'bg-[#1F6FEB] text-white scale-105'
                                        : 'bg-[#21262D] text-[#1F6FEB] hover:bg-[#30363D]'
                                    }
                                `}
                            >
                                {tag}
                                {tagFilter === tag && <X size={10} className="ml-1 inline" />}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content Area */}
                {isSearchMode ? (
                    /* Cross-day search results */
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-[#7D8590] uppercase tracking-wider">
                                Search Results
                                {searchResultDays.length > 0 && (
                                    <span className="ml-2 text-[#E6EDF3]">
                                        ({searchResultDays.reduce((sum, d) => sum + d.entries.length, 0)} entries across {searchResultDays.length} days)
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-xs text-[#7D8590] hover:text-[#E6EDF3] flex items-center gap-1"
                            >
                                <X size={12} />
                                Clear search
                            </button>
                        </div>

                        {searchResultDays.length > 0 ? (
                            <div className="space-y-4">
                                {searchResultDays.map(({ date, entries }) => (
                                    <div key={date}>
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                goToDate(parseISO(date));
                                            }}
                                            className="text-xs font-medium text-[#1F6FEB] hover:text-[#388BFD] mb-2 flex items-center gap-1.5 transition-colors"
                                        >
                                            <CalendarIcon size={12} />
                                            {formatDisplayDate(date, 'EEEE, MMM d, yyyy')}
                                        </button>
                                        <div className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden divide-y divide-[#21262D]">
                                            {entries.map((entry) => (
                                                <EntryRow
                                                    key={entry.id}
                                                    entry={entry}
                                                    onEdit={handleEdit}
                                                    onDelete={handleDelete}
                                                    entities={entities}
                                                    showDate={true}
                                                    editingId={editingEntryId}
                                                    onEditingChange={setEditingEntryId}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 animate-fade-in">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#161B22] border border-[#30363D] flex items-center justify-center">
                                    <Search size={24} className="text-[#7D8590]" />
                                </div>
                                <p className="text-[#7D8590] mb-1">No matching entries</p>
                                <p className="text-sm text-[#484F58]">Try a different search term</p>
                            </div>
                        )}
                    </section>
                ) : (
                    /* Normal day view */
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-[#7D8590] uppercase tracking-wider">
                                {isToday ? "Today's Entries" : 'Entries'}
                                {displayEntries.length > 0 && (
                                    <span className="ml-2 text-[#E6EDF3]">({displayEntries.length})</span>
                                )}
                            </h2>
                            {tagFilter && (
                                <button
                                    onClick={() => setTagFilter(null)}
                                    className="text-xs text-[#7D8590] hover:text-[#E6EDF3] flex items-center gap-1"
                                >
                                    <X size={12} />
                                    Clear filter
                                </button>
                            )}
                        </div>

                        {displayEntries.length > 0 ? (
                            <div className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden divide-y divide-[#21262D]">
                                {displayEntries.map((entry, index) => (
                                    <EntryRow
                                        key={entry.id}
                                        entry={entry}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        animationDelay={index * 50}
                                        entities={entities}
                                        showDate={true}
                                        editingId={editingEntryId}
                                        onEditingChange={setEditingEntryId}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 animate-fade-in">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#161B22] border border-[#30363D] flex items-center justify-center">
                                    <Plus size={24} className="text-[#7D8590]" />
                                </div>
                                <p className="text-[#7D8590] mb-1">
                                    {tagFilter ? `No entries with ${tagFilter}` : 'No entries yet'}
                                </p>
                                <p className="text-sm text-[#484F58]">
                                    {tagFilter ? 'Try a different filter' : 'Start by logging your first activity above'}
                                </p>
                            </div>
                        )}

                        {/* Pagination (Load More) */}
                        {!isSearchMode && allLogs.length >= pageLimit && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => setPageLimit(prev => prev + 100)}
                                    disabled={isFetching}
                                    className="px-6 py-2 rounded-lg bg-[#21262D] text-[#E6EDF3] hover:bg-[#30363D] transition-all text-sm font-medium disabled:opacity-50"
                                >
                                    {isFetching ? 'Loading...' : 'Show older history'}
                                </button>
                            </div>
                        )}
                    </section>
                )}

            </div>


            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete Entry"
                message="Are you sure you want to delete this log entry? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
}
