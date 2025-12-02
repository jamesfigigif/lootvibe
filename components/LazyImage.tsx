import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className = '' }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [showSpinner, setShowSpinner] = useState(false);
    const [hasError, setHasError] = useState(false);

    React.useEffect(() => {
        // Check if image is already loaded (cached)
        const img = new Image();
        img.src = src;
        if (img.complete) {
            setIsLoading(false);
            return;
        }

        // Grace period: only show spinner if loading takes longer than 150ms
        const timer = setTimeout(() => {
            setShowSpinner(true);
        }, 150);

        return () => clearTimeout(timer);
    }, [src]);

    return (
        <div className="relative w-full h-full">
            {isLoading && showSpinner && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-lg">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            )}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-lg">
                    <div className="text-xs text-red-400">Failed to load</div>
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                }}
            />
        </div>
    );
};
