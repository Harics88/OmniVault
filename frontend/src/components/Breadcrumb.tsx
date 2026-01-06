import { ChevronRight, Home } from 'lucide-react';
import type { NoteBreadcrumb } from '../types';

interface BreadcrumbProps {
    items: NoteBreadcrumb[];
    onNavigate: (id: number | null) => void;
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
    return (
        <nav className="flex items-center gap-1 text-sm overflow-x-auto">
            {/* Home/Root */}
            <button
                onClick={() => onNavigate(null)}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-background-hover transition-colors text-text-muted hover:text-text-primary"
            >
                <Home size={14} />
                <span>Notes</span>
            </button>

            {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-1">
                    <ChevronRight size={14} className="text-text-muted" />
                    <button
                        onClick={() => onNavigate(item.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-background-hover transition-colors ${index === items.length - 1
                                ? 'text-text-primary font-medium'
                                : 'text-text-muted hover:text-text-primary'
                            }`}
                    >
                        <span>{item.icon}</span>
                        <span className="truncate max-w-[150px]">{item.title}</span>
                    </button>
                </div>
            ))}
        </nav>
    );
}

export default Breadcrumb;
