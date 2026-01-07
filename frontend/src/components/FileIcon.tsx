import React from 'react';

// File icon component with Untitled UI style
interface FileIconProps {
    extension: string;
    size?: number;
}

export function FileIcon({ extension, size = 20 }: FileIconProps) {
    const ext = extension.toLowerCase();

    // Color mappings similar to Untitled UI file icons
    const getColors = () => {
        // Code files - Purple
        if (['js', 'jsx', 'ts', 'tsx', 'json'].includes(ext)) {
            return { bg: '#F3E8FF', border: '#9333EA', text: '#7C3AED' };
        }
        if (['py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'rb', 'php', 'sh'].includes(ext)) {
            return { bg: '#F3E8FF', border: '#9333EA', text: '#7C3AED' };
        }

        // Images - Green
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', 'bmp'].includes(ext)) {
            return { bg: '#D1FAE5', border: '#10B981', text: '#059669' };
        }

        // Videos - Red
        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
            return { bg: '#FEE2E2', border: '#EF4444', text: '#DC2626' };
        }

        // Audio - Pink
        if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
            return { bg: '#FCE7F3', border: '#EC4899', text: '#DB2777' };
        }

        // Archives - Yellow
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return { bg: '#FEF3C7', border: '#F59E0B', text: '#D97706' };
        }

        // Spreadsheets - Emerald
        if (['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
            return { bg: '#D1FAE5', border: '#10B981', text: '#059669' };
        }

        // Documents - Blue  
        if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)) {
            return { bg: '#DBEAFE', border: '#3B82F6', text: '#2563EB' };
        }

        // Presentations - Orange
        if (['ppt', 'pptx', 'key'].includes(ext)) {
            return { bg: '#FFEDD5', border: '#F97316', text: '#EA580C' };
        }

        // Default - Gray
        return { bg: '#F3F4F6', border: '#6B7280', text: '#4B5563' };
    };

    const colors = getColors();
    const displayExt = ext.toUpperCase().slice(0, 4);

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* File shape */}
            <path
                d="M8 4C8 2.89543 8.89543 2 10 2H22L32 12V36C32 37.1046 31.1046 38 30 38H10C8.89543 38 8 37.1046 8 36V4Z"
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth="1.5"
            />
            {/* Fold corner */}
            <path
                d="M22 2V10C22 11.1046 22.8954 12 24 12H32"
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth="1.5"
                strokeLinejoin="bevel"
            />
            {/* Extension label */}
            <rect
                x="11"
                y="24"
                width="18"
                height="10"
                rx="2"
                fill={colors.border}
            />
            <text
                x="20"
                y="31"
                fontSize="7"
                fontWeight="600"
                fill="white"
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
            >
                {displayExt}
            </text>
        </svg>
    );
}

// Helper function to get file extension from filename/path
export function getFileExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ext;
}
