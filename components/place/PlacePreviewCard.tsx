'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  X,
  ArrowRight,
  Accessibility,
  ArrowUpDown,
  Bath,
  Car,
  DoorOpen,
  Armchair,
  Volume2,
  VolumeX,
  Navigation,
} from 'lucide-react';
import { Place, AccessPointType } from '@/types';

interface PlacePreviewCardProps {
  place: Place;
  onClose?: () => void;
  onViewDetails?: (placeId: string) => void;
  userLocation?: [number, number] | null;
}

const FEATURE_CONFIG: Record<
  AccessPointType,
  { label: string; icon: React.ElementType }
> = {
  ramp: { label: 'Ramp', icon: Accessibility },
  elevator: { label: 'Lift', icon: ArrowUpDown },
  accessible_toilet: { label: 'Toilet Disabilitas', icon: Bath },
  accessible_parking: { label: 'Parkir Disabilitas', icon: Car },
  accessible_entrance: { label: 'Pintu Utama', icon: DoorOpen },
  priority_seating: { label: 'Kursi Prioritas', icon: Armchair },
};

function calculateDistanceInMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function PlacePreviewCard({
  place,
  onClose,
  onViewDetails,
  userLocation,
}: PlacePreviewCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop any active speech if the selected place changes or unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [place.id]);

  // Compute distance from user's live position
  const distanceInfo = useMemo(() => {
    if (!userLocation || !place.coordinates) return null;
    const meters = calculateDistanceInMeters(userLocation, place.coordinates);
    if (meters < 1000) {
      const minutes = Math.max(1, Math.ceil(meters / 65)); // ~65 m/min wheelchair speed
      return { text: `${meters} m`, estimate: `±${minutes} mnt`, meters };
    }
    const km = (meters / 1000).toFixed(1);
    return { text: `${km} km`, estimate: null, meters };
  }, [userLocation, place.coordinates]);

  // Accessibility Text-to-Speech audio reader for visually impaired
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const rec = place.recommendedAccessPoint
      ? `Rekomendasi titik akses: ${place.recommendedAccessPoint.name}.`
      : 'Memiliki titik akses terverifikasi.';
    const features =
      place.primaryFeatures.length > 0
        ? `Fasilitas disabilitas tersedia: ${place.primaryFeatures
            .map((f) => FEATURE_CONFIG[f]?.label || f)
            .join(', ')}.`
        : '';
    const dist = distanceInfo ? `Jarak sekitar ${distanceInfo.text} dari posisi Anda.` : '';

    const textToSpeak = `${place.name}. Kategori ${place.category}. ${dist} ${rec} ${features}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="w-full max-w-full sm:max-w-md rounded-t-3xl rounded-b-none sm:rounded-2xl border-t sm:border border-gray-200/90 bg-white/98 p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-5 shadow-2xl backdrop-blur-md transition-all duration-200">
      {/* Mobile drag handle indicator */}
      <div className="sm:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto mb-2.5" />

      {/* Header: Status Badge, Audio Reader & Close button */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shrink-0">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 stroke-[2.5]" />
            Aksesibel
          </span>
          <span className="text-[11px] font-medium text-gray-500 truncate max-w-[130px] sm:max-w-[180px]">
            {place.recommendedAccessPoint
              ? place.recommendedAccessPoint.name
              : 'Akses terverifikasi'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* TTS Audio Reader Button */}
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`flex h-7 px-2 items-center gap-1 rounded-full text-xs font-semibold transition-all ${
              isSpeaking
                ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                : 'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100'
            }`}
            aria-label={isSpeaking ? 'Hentikan suara pembaca' : 'Dengarkan info aksesibilitas tempat ini'}
            title={isSpeaking ? 'Hentikan suara pembaca' : 'Dengarkan info tempat ini (Audio Reader)'}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="h-3.5 w-3.5 stroke-[2.2]" />
                <span className="hidden sm:inline text-[11px]">Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 stroke-[2.2]" />
                <span className="hidden sm:inline text-[11px]">Dengar</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Tutup pratinjau tempat"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Place Title */}
      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-1">
        {place.name}
      </h3>

      {/* Category & Address */}
      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <span className="shrink-0">{place.category}</span>
        <span className="text-gray-300">•</span>
        <span className="truncate">{place.address}</span>
      </div>

      {/* Real-time distance indicator from user */}
      {distanceInfo && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-blue-50/70 border border-blue-100/80 px-2 py-0.5 text-xs font-medium text-blue-800">
          <Navigation className="h-3.5 w-3.5 text-blue-600 stroke-[2.2] shrink-0" />
          <span className="truncate">
            <strong className="font-bold">{distanceInfo.text}</strong> dari lokasi Anda
            {distanceInfo.estimate && (
              <span className="text-blue-600/80 ml-1">({distanceInfo.estimate})</span>
            )}
          </span>
        </div>
      )}

      {/* Amenity chips */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {place.primaryFeatures.map((feat) => {
          const config = FEATURE_CONFIG[feat];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <span
              key={feat}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200/90 bg-gray-50/70 px-2 py-0.5 text-[11px] sm:text-xs font-medium text-gray-700"
            >
              <Icon className="h-3 w-3 text-gray-600 stroke-[2.2]" />
              {config.label}
            </span>
          );
        })}
      </div>

      {/* Divider */}
      <div className="my-2.5 h-px w-full bg-gray-100" />

      {/* Footer Info & View Details Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-gray-900">
            {place.accessPoints.length} Titik Akses
          </p>
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">
            Diperbarui {place.updatedAt}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onViewDetails?.(place.id)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer shrink-0"
        >
          <span>Lihat Detail</span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
