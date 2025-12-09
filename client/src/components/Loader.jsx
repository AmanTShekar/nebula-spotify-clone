import React from 'react';

const Loader = () => {
    return (
        <div className="flex items-center justify-center h-full w-full min-h-[200px]">
            <div className="flex items-end gap-1 h-8">
                <div className="w-1.5 bg-green-500 animate-music-bar-1 h-full"></div>
                <div className="w-1.5 bg-green-500 animate-music-bar-2 h-full"></div>
                <div className="w-1.5 bg-green-500 animate-music-bar-3 h-full"></div>
                <div className="w-1.5 bg-green-500 animate-music-bar-4 h-full"></div>
            </div>
        </div>
    );
};

export default Loader;
