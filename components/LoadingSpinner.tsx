import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
    message?: string;
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message = 'Loading...',
    fullScreen = false
}) => {
    const containerClass = fullScreen
        ? 'fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f19]/95 backdrop-blur-xl'
        : 'flex items-center justify-center p-12';

    return (
        <div className={containerClass}>
            <div className="relative flex flex-col items-center">
                {/* Outer rotating hexagon */}
                <div className="relative w-32 h-32 animate-spin-slow">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-20 blur-xl rounded-full"></div>
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <defs>
                            <linearGradient id="hexGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
                            </linearGradient>
                        </defs>
                        <polygon
                            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
                            fill="none"
                            stroke="url(#hexGradient1)"
                            strokeWidth="2"
                            className="animate-pulse"
                        />
                    </svg>
                </div>

                {/* Middle counter-rotating hexagon */}
                <div className="absolute w-24 h-24 animate-spin-reverse">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <defs>
                            <linearGradient id="hexGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
                            </linearGradient>
                        </defs>
                        <polygon
                            points="50,10 85,30 85,70 50,90 15,70 15,30"
                            fill="none"
                            stroke="url(#hexGradient2)"
                            strokeWidth="2"
                        />
                    </svg>
                </div>

                {/* Inner spinning icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-pink-400 animate-pulse" />
                    </div>
                </div>

                {/* Pulsing dots */}
                <div className="absolute -bottom-8 flex gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>

                {/* Loading message */}
                {message && (
                    <div className="mt-16 text-center">
                        <p className="text-slate-300 font-medium text-sm tracking-wide animate-pulse">
                            {message}
                        </p>
                        <div className="mt-2 flex items-center justify-center gap-1">
                            <div className="w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
                            <div className="w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '200ms' }}></div>
                            <div className="w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '400ms' }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
