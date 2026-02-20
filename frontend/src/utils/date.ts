import { format, parseISO, isValid } from 'date-fns';

/**
 * Parses a date string from the server.
 * Handles naive UTC strings by ensuring they are interpreted as UTC.
 */
export const parseServerDate = (dateStr: string | null | undefined): Date => {
    if (!dateStr) return new Date();

    // If it's already an ISO string with Z or offset, parseISO handles it correctly.
    // If it's a naive string (no Z and no offset), we append Z to force UTC interpretation.
    const normalizedStr = (dateStr.endsWith('Z') || dateStr.includes('+') || (dateStr.includes('-') && dateStr.split('-').length > 3))
        ? dateStr
        : `${dateStr}${dateStr.includes('T') ? 'Z' : ''}`;

    try {
        const date = parseISO(normalizedStr);
        return isValid(date) ? date : new Date();
    } catch (e) {
        console.error('Failed to parse date:', dateStr, e);
        return new Date();
    }
};

/**
 * Formats a date for display.
 */
export const formatDisplayDate = (date: Date | string | null | undefined, pattern: string = 'MMM d, yyyy'): string => {
    if (!date) return '--';
    const dateObj = typeof date === 'string' ? parseServerDate(date) : date;
    return format(dateObj, pattern);
};

/**
 * Formats a date to a standard time string.
 */
export const formatDisplayTime = (date: Date | string | null | undefined): string => {
    if (!date) return '--';
    const dateObj = typeof date === 'string' ? parseServerDate(date) : date;
    return format(dateObj, 'h:mm a');
};

/**
 * Formats a date for machine-readable logging (e.g., Daily Log routes).
 */
export const formatISO = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
};
