import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
    value,
    onChange,
    placeholder = "Search...",
    onClear,
    onEscape,
    onFocus,
    isLoading = false,
    className = "",
    inputClassName = "",
    iconClassName = "h-4 w-4",
    spinnerClassName = "h-3.5 w-3.5",
    clearIconClassName = "h-3.5 w-3.5",
    containerRef = null
}) {
    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${iconClassName}`} />
            
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                onKeyDown={(e) => {
                    if (e.key === 'Escape' && onEscape) {
                        onEscape();
                    }
                }}
                className={`w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-9 pr-9 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500 ${inputClassName}`}
            />
            
            {value && !isLoading && (
                <button
                    onClick={() => {
                        onChange("");
                        if (onClear) onClear();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-0.5 rounded-full hover:bg-gray-700"
                    title="Clear Search"
                >
                    <X className={clearIconClassName} />
                </button>
            )}
            
            {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className={`animate-spin border-2 border-gray-400 border-t-blue-500 rounded-full ${spinnerClassName}`}></div>
                </div>
            )}
        </div>
    );
}
