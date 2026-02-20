/**
 * Utility to extract entity IDs from Tiptap mention HTML
 */
export const extractEntityIds = (html: string): number[] => {
    if (!html) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const mentions = doc.querySelectorAll('.mention');

    const ids = Array.from(mentions)
        .map(m => {
            const id = m.getAttribute('data-id');
            return id ? parseInt(id) : 0;
        })
        .filter(id => id > 0);

    return Array.from(new Set(ids));
};
