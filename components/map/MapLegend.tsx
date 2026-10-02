'use client';

import React from 'react';

export function MapLegend() {
  return (
    <div className="flex items-center gap-3.5 rounded-full border border-gray-200/90 bg-white/95 px-3.5 py-1.5 shadow-md backdrop-blur-md select-none text-[11px] sm:text-xs font-semibold text-gray-700">
      {/* Selected place */}
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-xs bg-blue-600 ring-2 ring-blue-100" />
        <span>Selected Place</span>
      </div>

      <span className="h-3 w-px bg-gray-200" />

      {/* Verified access */}
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
        <span>Verified Access</span>
      </div>

      <span className="h-3 w-px bg-gray-200" />

      {/* User Location */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600 border border-white" />
        </span>
        <span>Lokasi Anda</span>
      </div>
    </div>
  );
}

