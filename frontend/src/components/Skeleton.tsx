import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height
}) => {
    const baseClass = 'animate-pulse bg-background-elevated/80';

    let variantClass = '';
    switch (variant) {
        case 'circle':
            variantClass = 'rounded-full';
            break;
        case 'rect':
            variantClass = 'rounded-lg';
            break;
        default:
            variantClass = 'rounded min-h-[1em] mb-2 last:mb-0';
    }

    const style: React.CSSProperties = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseClass} ${variantClass} ${className}`}
            style={style}
        />
    );
};

export default Skeleton;
