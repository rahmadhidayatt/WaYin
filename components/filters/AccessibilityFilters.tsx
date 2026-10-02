'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  Info,
  Accessibility,
  ArrowUpDown,
  Bath,
  Car,
  DoorOpen,
  Armchair,
  RotateCcw,
} from 'lucide-react';
import { AccessPointType } from '@/types';

export type FilterCategory = 'all' | AccessPointType;

interface AccessibilityFiltersProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  filteredCount?: number;
}

interface FilterPill {
  id: AccessPointType;
  label: string;
  icon: React.ElementType;
  badgeBg: string;
  badgeColor: string;
}

const ACCESSIBILITY_PILLS: FilterPill[] = [
  {
    id: 'ramp',
    label: 'Ramp',
    icon: Accessibility,
    badgeBg: 'bg-blue-600',
    badgeColor: 'text-white',
  },
  {
    id: 'elevator',
    label: 'Lift',
    icon: ArrowUpDown,
    badgeBg: 'bg-indigo-600',
    badgeColor: 'text-white',
  },
  {
    id: 'accessible_toilet',
    label: 'Toilet Disabilitas',
    icon: Bath,
    badgeBg: 'bg-purple-600',
    badgeColor: 'text-white',
  },
  {
    id: 'accessible_parking',
    label: 'Parkir Disabilitas',
    icon: Car,
    badgeBg: 'bg-amber-600',
    badgeColor: 'text-white',
  },
  {
    id: 'accessible_entrance',
    label: 'Pintu Utama',
    icon: DoorOpen,
    badgeBg: 'bg-emerald-600',
    badgeColor: 'text-white',
  },
  {
    id: 'priority_seating',
    label: 'Kursi Prioritas',
    icon: Armchair,
    badgeBg: 'bg-rose-600',
    badgeColor: 'text-white',
  },
];

export function AccessibilityFilters({
  selectedFilter,
  onFilterChange,
  filteredCount,
}: AccessibilityFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      {/* ── Mobile: horizontal scrollable pill strip (< sm) ── */}
      <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5 select-none touch-pan-x">
        {ACCESSIBILITY_PILLS.map((pill) => {
          const Icon = pill.icon;
          const isActive = selectedFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => onFilterChange(isActive ? 'all' : pill.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-500/30'
                  : 'bg-white/95 text-gray-700 border-gray-200 shadow-sm backdrop-blur-md'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : `${pill.badgeBg} ${pill.badgeColor}`
                }`}
              >
                <Icon className="h-2.5 w-2.5 stroke-[2.5]" />
              </div>
              <span>{pill.label}</span>
            </button>
          );
        })}
        {selectedFilter !== 'all' && (
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 shadow-sm cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* ── Desktop/tablet: accordion card (sm+) ── */}
      <div className="hidden sm:block w-[330px] rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-xl p-3.5 text-gray-900 select-none transition-all">
        {/* Top Header Row with Accordion Dropdown toggle */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-blue-600 stroke-[2.2]" />
            <span className="text-sm font-bold text-gray-900 tracking-tight">Filter Fasilitas</span>
            {selectedFilter !== 'all' && (
              <span className="ml-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                Aktif
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-3">
            {/* Accessibility Feature Pills */}
            <div className="flex flex-wrap gap-2">
              {ACCESSIBILITY_PILLS.map((pill) => {
                const Icon = pill.icon;
                const isActive = selectedFilter === pill.id;

                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => onFilterChange(isActive ? 'all' : pill.id)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white border border-blue-700 shadow-md ring-2 ring-blue-500/30 font-semibold'
                        : 'bg-gray-50 text-gray-700 border border-gray-200/80 hover:bg-gray-100 hover:border-gray-300 active:scale-95'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : `${pill.badgeBg} ${pill.badgeColor}`
                      }`}
                    >
                      <Icon className="h-2.5 w-2.5 stroke-[2.5]" />
                    </div>
                    <span>{pill.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Info & Reset Row */}
            <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-1.5">
                {selectedFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => onFilterChange('all')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset Filter</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-400 font-medium">
                    Semua fasilitas ditampilkan
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {filteredCount !== undefined && (
                  <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {filteredCount} tempat
                  </span>
                )}

                {/* Info Button with Tooltip */}
                <div className="relative group">
                  <button
                    type="button"
                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Informasi Filter Fasilitas"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2.5 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl text-[11px] text-white leading-relaxed z-30 pointer-events-none">
                    Klik tombol fasilitas (Ramp, Lift, Toilet, dll.) untuk hanya menampilkan lokasi di peta yang memiliki fasilitas tersebut.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
