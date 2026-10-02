'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Flag,
  Accessibility,
  ArrowUpDown,
  Bath,
  Car,
  DoorOpen,
  Armchair,
  Building2,
  Camera,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { fetchAccessPointById, createReport } from '@/lib/supabase';
import { Place, AccessPoint, AccessPointType } from '@/types';

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

export default function AccessPointDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const apId = resolvedParams.id;

  const [data, setData] = useState<{ accessPoint: AccessPoint; place: Place } | null>(null);
  const [loading, setLoading] = useState(true);

  // Report Modal State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<
    'incorrect_information' | 'access_point_unavailable' | 'wrong_location' | 'other'
  >('incorrect_information');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetchAccessPointById(apId);
        if (isMounted) {
          setData(res);
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
  }, [apId]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setIsSubmittingReport(true);
    const { success } = await createReport({
      accessPointId: data.accessPoint.id,
      reason: reportReason,
      details: reportDetails,
    });

    setIsSubmittingReport(false);
    if (success) {
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess(false);
        setReportDetails('');
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 animate-pulse" />
          <p className="text-sm font-semibold text-gray-500">Loading access point details...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="h-12 w-12 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-400 mb-4">
          <Accessibility className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Point Not Found</h2>
        <p className="text-sm text-gray-500 max-w-sm mt-1 mb-6">
          The requested access point could not be located.
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

  const { accessPoint: ap, place } = data;
  const Icon = TYPE_ICONS[ap.type] || Accessibility;

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900 pb-20 overflow-y-auto">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white/95 px-3.5 sm:px-8 backdrop-blur-md">
        <Link
          href={`/place/${place.id}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors min-w-0"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate max-w-[170px] sm:max-w-xs">Kembali ke {place.name}</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-700 shadow-xs hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-all active:scale-95 shrink-0"
        >
          <Flag className="h-4 w-4 text-red-500" />
          <span>Laporkan</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-3.5 sm:px-6 pt-4 sm:pt-8 space-y-4 sm:space-y-6">
        {/* Core Access Point Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-8 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 ring-2 ring-blue-100">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  {TYPE_LABELS[ap.type]}
                </span>
                <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900 truncate">
                  {ap.name}
                </h1>
              </div>
            </div>

            <span
              className={`rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold ring-1 ring-inset shrink-0 ${
                ap.verification === 'verified'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  : 'bg-amber-50 text-amber-700 ring-amber-600/20'
              }`}
            >
              {ap.verification === 'verified' ? 'TERVERIFIKASI' : 'BELUM VERIFIKASI'}
            </span>
          </div>

          <div className="mt-3 sm:mt-4 flex items-start sm:items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium">
            <Building2 className="h-4 w-4 text-gray-400 shrink-0 mt-0.5 sm:mt-0" />
            <span className="leading-snug">
              Berada di{' '}
              <Link href={`/place/${place.id}`} className="font-bold text-blue-600 hover:underline">
                {place.name}
              </Link>{' '}
              ({place.address})
            </span>
          </div>

          {/* Description */}
          <div className="mt-4 sm:mt-5 rounded-xl sm:rounded-2xl bg-gray-50/80 p-3.5 sm:p-4 border border-gray-100">
            <h3 className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Deskripsi Titik Akses
            </h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {ap.description || 'Tidak ada catatan tambahan untuk titik akses ini.'}
            </p>
          </div>

          {/* Status Breakdown Grid */}
          <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 border-t border-gray-100 pt-4 sm:pt-5">
            <div className="rounded-xl bg-gray-50 p-2.5 sm:p-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Kondisi
              </span>
              <p className="text-xs sm:text-sm font-bold capitalize text-gray-900 mt-0.5">
                {ap.condition === 'good' ? 'Baik' : ap.condition === 'fair' ? 'Cukup' : 'Kurang'}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-2.5 sm:p-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Ketersediaan
              </span>
              <p className="text-xs sm:text-sm font-bold capitalize text-gray-900 mt-0.5">
                {ap.availability === 'available' ? 'Tersedia' : ap.availability === 'unavailable' ? 'Tidak Tersedia' : 'Belum Diketahui'}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-2.5 sm:p-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Tangga
              </span>
              <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5">
                {ap.hasNoStairs ? 'Tanpa Tangga' : 'Ada Tangga'}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-2.5 sm:p-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Parkir Disabilitas
              </span>
              <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5">
                {ap.nearAccessibleParking ? 'Ada di Dekatnya' : 'Tidak Ada'}
              </p>
            </div>
          </div>
        </div>

        {/* Deterministic Scoring Breakdown */}
        <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                Skor Aksesibilitas WAYIN
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Perhitungan transparan sesuai panduan aksesibilitas.
              </p>
            </div>
            <span className="text-xl sm:text-2xl font-black text-blue-600 bg-blue-50 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl shrink-0">
              {ap.score} poin
            </span>
          </div>

          <div className="space-y-1.5 sm:space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">Fasilitas Ramp</span>
              <span className="font-bold text-gray-900">{ap.type === 'ramp' ? '+40' : '0'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">Jalur Tanpa Tangga</span>
              <span className="font-bold text-gray-900">{ap.hasNoStairs ? '+30' : '0'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">Kondisi Fisik Baik</span>
              <span className="font-bold text-gray-900">{ap.condition === 'good' ? '+15' : '0'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">Terverifikasi Komunitas</span>
              <span className="font-bold text-gray-900">{ap.verification === 'verified' ? '+10' : '0'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-gray-600">Dekat Parkir Disabilitas</span>
              <span className="font-bold text-gray-900">{ap.nearAccessibleParking ? '+5' : '0'}</span>
            </div>
          </div>
        </div>

        {/* Photo Evidence Section */}
        <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Camera className="h-5 w-5 text-gray-700" />
            <h2 className="text-sm sm:text-base font-bold text-gray-900">
              Bukti Foto Aksesibilitas
            </h2>
          </div>

          {ap.photoUrl ? (
            <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 shadow-inner max-h-[340px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ap.photoUrl}
                alt={ap.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-black/60 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold text-white">
                Foto Bukti Terverifikasi
              </div>
            </div>
          ) : (
            <div className="rounded-xl sm:rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 sm:p-8 text-center">
              <Camera className="h-7 w-7 sm:h-8 sm:w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600">Belum Ada Foto Diunggah</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Anggota komunitas dapat berkontribusi foto bukti untuk mendukung titik akses ini.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-500" />
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  Laporkan Informasi Tidak Tepat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 stroke-[2.5]" />
                </div>
                <h4 className="text-base font-bold text-gray-900">Laporan Tercatat</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Terima kasih! Moderator komunitas akan meninjau titik akses ini.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Apa masalahnya?
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportReason(e.target.value as 'incorrect_information' | 'access_point_unavailable' | 'wrong_location' | 'other')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 min-h-[44px]"
                  >
                    <option value="incorrect_information">Informasi Tidak Tepat</option>
                    <option value="access_point_unavailable">Titik Akses Tidak Tersedia / Ditutup</option>
                    <option value="wrong_location">Lokasi Salah di Peta</option>
                    <option value="other">Masalah Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Keterangan Tambahan
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Berikan detail untuk membantu rekan disabilitas lainnya..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 pb-2 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer min-h-[44px]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 cursor-pointer min-h-[44px]"
                  >
                    {isSubmittingReport ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <span>Kirim Laporan</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

