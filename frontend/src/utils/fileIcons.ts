import {
    FileText,
    FileCode,
    FileImage,
    FileVideo,
    FileAudio,
    FileArchive,
    FileSpreadsheet,
    File
} from 'lucide-react';

export interface FileIconInfo {
    icon: any;
    color: string;
}

export function getFileIcon(filename: string): FileIconInfo {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // Code files
    const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'sh', 'bat', 'ps1'];
    if (codeExtensions.includes(ext)) {
        return { icon: FileCode, color: 'text-purple-500' };
    }

    // Images
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico', 'tiff'];
    if (imageExtensions.includes(ext)) {
        return { icon: FileImage, color: 'text-green-500' };
    }

    // Videos
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v'];
    if (videoExtensions.includes(ext)) {
        return { icon: FileVideo, color: 'text-red-500' };
    }

    // Audio
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];
    if (audioExtensions.includes(ext)) {
        return { icon: FileAudio, color: 'text-pink-500' };
    }

    // Archives
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
    if (archiveExtensions.includes(ext)) {
        return { icon: FileArchive, color: 'text-yellow-600' };
    }

    // Spreadsheets/Data
    const spreadsheetExtensions = ['xlsx', 'xls', 'csv', 'ods'];
    if (spreadsheetExtensions.includes(ext)) {
        return { icon: FileSpreadsheet, color: 'text-emerald-600' };
    }

    // Documents
    const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'md'];
    if (docExtensions.includes(ext)) {
        return { icon: FileText, color: 'text-blue-500' };
    }

    // Default
    return { icon: File, color: 'text-gray-500' };
}
