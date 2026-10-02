'use client';

import React from 'react';
import { Plus, Minus, Locate } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  hasUserLocation?: boolean;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onRecenter,
  hasUserLocation,
}: MapControlsProps) {
  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Zoom In & Out block */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-md">
        <button
          type="button"
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="flex h-9 w-9 items-center justify-center text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 border-b border-gray-100 active:bg-gray-200"
          title="Zoom in"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="flex h-9 w-9 items-center justify-center text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
          title="Zoom out"
        >
          <Minus className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Recenter button (prioritizes user location) */}
      <button
        type="button"
        onClick={onRecenter}
        aria-label={hasUserLocation ? 'Pusatkan ke lokasi saya' : 'Pusatkan peta'}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/90 bg-white shadow-md transition-all active:scale-95 ${
          hasUserLocation
            ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
            : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
        }`}
        title={hasUserLocation ? 'Pusatkan ke lokasi Anda' : 'Pusatkan peta ke Jakarta'}
      >
        <Locate className="h-4 w-4 stroke-[2.2]" />
        {hasUserLocation && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
        )}
      </button>
    </div>
  );
}

