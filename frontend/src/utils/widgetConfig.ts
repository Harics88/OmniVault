export interface WidgetConfig {
    id: string;
    title: string;
    enabled: boolean;
    order: number;
    span: 'full' | 'half' | 'third' | 'two-thirds';
}

export const DEFAULT_WIDGETS: Record<string, WidgetConfig> = {
    heatmap: { id: 'heatmap', title: 'Activity Heatmap', enabled: true, order: 0, span: 'two-thirds' },
    quickStats: { id: 'quickStats', title: 'Quick Stats', enabled: true, order: 1, span: 'full' },
    todayLog: { id: 'todayLog', title: "Today's Log", enabled: true, order: 2, span: 'two-thirds' },
    activeTasks: { id: 'activeTasks', title: 'Active Tasks', enabled: true, order: 3, span: 'third' },
    recentNotes: { id: 'recentNotes', title: 'Recent Notes', enabled: true, order: 4, span: 'third' },
    recentSnippets: { id: 'recentSnippets', title: 'Recent Snippets', enabled: true, order: 5, span: 'third' },
    recentBookmarks: { id: 'recentBookmarks', title: 'Recent Bookmarks', enabled: true, order: 6, span: 'third' },
};

export const loadWidgetConfig = (): WidgetConfig[] => {
    const saved = localStorage.getItem('dashboardWidgetConfig');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse widget config', e);
        }
    }
    return Object.values(DEFAULT_WIDGETS).sort((a, b) => a.order - b.order);
};

export const saveWidgetConfig = (config: WidgetConfig[]) => {
    localStorage.setItem('dashboardWidgetConfig', JSON.stringify(config));
};
