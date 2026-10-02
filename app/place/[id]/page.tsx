'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  Accessibility,
  ArrowUpDown,
  Bath,
  Car,
  DoorOpen,
  Armchair,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { fetchPlaceById } from '@/lib/supabase';
import { Place, AccessPointType } from '@/types';

const TYPE_ICONS: Record<AccessPointType, React.ElementType> = {
  ramp: Accessibility,
  elevator: ArrowUpDown,
  accessible_toilet: Bath,
  accessible_parking: Car,
  accessible_entrance: DoorOpen,
  priority_seating: Armchair,
};

const TYPE_LABELS: Record<AccessPointType, string> = {
  ramp: 'Ramp',
  elevator: 'Lift',
  accessible_toilet: 'Toilet Disabilitas',
  accessible_parking: 'Parkir Disabilitas',
  accessible_entrance: 'Pintu Tanpa Tangga',
  priority_seating: 'Kursi Prioritas',
};

export default function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const placeId = resolvedParams.id;

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchPlaceById(placeId);
        if (isMounted) {
          setPlace(data);
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [placeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 animate-pulse" />
          <p className="text-sm font-semibold text-gray-500">Loading place details...</p>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="h-12 w-12 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-400 mb-4">
          <Building2 className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Place Not Found</h2>
        <p className="text-sm text-gray-500 max-w-sm mt-1 mb-6">
          The place you are looking for doesn&apos;t exist or could not be loaded.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Map</span>
        </Link>
      </div>
    );
  }

  const verifiedCount = place.accessPoints.filter(
    (ap) => ap.verification === 'verified'
  ).length;

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900 pb-20 overflow-y-auto">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white/95 px-3.5 sm:px-8 backdrop-blur-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Peta</span>
        </Link>

        <Link
          href={`/add-access-point?placeId=${encodeURIComponent(place.id)}`}
          className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Titik</span>
        </Link>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-4xl px-3.5 sm:px-6 pt-4 sm:pt-8 space-y-4 sm:space-y-6">
        {/* Place Overview Header Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
              Tempat Aksesibel
            </span>
            <span className="text-xs font-semibold text-gray-400">•</span>
            <span className="text-xs font-semibold text-gray-600">{place.category}</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {place.name}
          </h1>

          <div className="mt-2 flex items-start sm:items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium">
            <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>{place.address}</span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 border-t border-gray-100 pt-4 sm:pt-5">
            <div className="rounded-xl sm:rounded-2xl bg-gray-50 p-3 sm:p-3.5">
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Total Titik Akses
              </span>
              <p className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">
                {place.accessPoints.length}
              </p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-emerald-50/60 p-3 sm:p-3.5">
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                Terverifikasi
              </span>
              <p className="text-lg sm:text-xl font-bold text-emerald-800 mt-0.5">
                {verifiedCount}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl sm:rounded-2xl bg-blue-50/60 p-3 sm:p-3.5">
              <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                Terakhir Diperbarui
              </span>
              <p className="text-xs sm:text-sm font-bold text-blue-900 mt-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Diperbarui {place.updatedAt}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Recommended Access Point Callout (Deterministic Scoring Winner) */}
        {place.recommendedAccessPoint && (
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-blue-500/20 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 p-4 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Titik Akses Terbaik</span>
            </div>

            <h2 className="text-base sm:text-xl font-bold text-gray-900">
              {place.recommendedAccessPoint.name}
            </h2>

            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
              {place.recommendedAccessPoint.description ||
                'Pintu masuk terverifikasi tertinggi dengan akses tanpa tangga.'}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-600 text-white px-2.5 py-1 text-xs font-semibold">
                Skor: {place.recommendedAccessPoint.score}/100
              </span>
              {place.recommendedAccessPoint.hasNoStairs && (
                <span className="rounded-lg bg-white border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-900">
                  Tanpa Tangga
                </span>
              )}
              {place.recommendedAccessPoint.nearAccessibleParking && (
                <span className="rounded-lg bg-white border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-900">
                  Dekat Parkir Disabilitas
                </span>
              )}
              <Link
                href={`/access-point/${place.recommendedAccessPoint.id}`}
                className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <span>Lihat Detail</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* All Access Points List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Semua Titik Akses ({place.accessPoints.length})
            </h2>
            <span className="text-[11px] sm:text-xs text-gray-500">
              Pilih untuk info & foto
            </span>
          </div>

          <div className="grid gap-2.5 sm:gap-3">
            {place.accessPoints.map((ap) => {
              const Icon = TYPE_ICONS[ap.type] || Accessibility;
              const isRecommended = place.recommendedAccessPoint?.id === ap.id;

              return (
                <Link
                  key={ap.id}
                  href={`/access-point/${ap.id}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-xs hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5 stroke-[2.2]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {ap.name}
                        </h3>
                        {isRecommended && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            Terbaik
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            ap.verification === 'verified'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {ap.verification === 'verified' ? 'TERVERIFIKASI' : 'BELUM DIVERIFIKASI'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {ap.description || `${TYPE_LABELS[ap.type]} kondisi ${ap.condition}.`}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium">
                        <span>Tipe: {TYPE_LABELS[ap.type]}</span>
                        <span>•</span>
                        <span>Kondisi: {ap.condition}</span>
                        <span>•</span>
                        <span>Status: {ap.availability}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50 shrink-0">
                    {ap.photoUrl ? (
                      <span className="text-[11px] font-medium text-blue-600 bg-blue-50 rounded-md px-2 py-0.5">
                        Ada Foto
                      </span>
                    ) : (
                      <span />
                    )}
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

