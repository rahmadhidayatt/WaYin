'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Accessibility,
  ArrowUpDown,
  Bath,
  Car,
  DoorOpen,
  Armchair,
  LogIn,
  X,
} from 'lucide-react';
import { fetchPlaces, createAccessPoint, uploadAccessPointPhoto } from '@/lib/supabase';
import { INDONESIA_DEFAULT_CENTER } from '@/lib/mock-data';
import { Place, AccessPointType } from '@/types';
import { useAuth } from '@/components/auth/AuthContext';

function AddAccessPointForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlaceId = searchParams.get('placeId') || '';

  const { user, loading: authLoading } = useAuth();

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState(preselectedPlaceId);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccessPointType>('ramp');
  const [condition, setCondition] = useState<'good' | 'fair' | 'poor'>('good');
  const [availability, setAvailability] = useState<'available' | 'unavailable' | 'unknown'>('available');
  const [hasNoStairs, setHasNoStairs] = useState(true);
  const [nearAccessibleParking, setNearAccessibleParking] = useState(false);
  const [description, setDescription] = useState('');

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPlaces().then((data) => {
      setPlaces(data);
      if (!selectedPlaceId && data.length > 0) {
        setSelectedPlaceId(data[0].id);
      }
    });
  }, [selectedPlaceId]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaceId) {
      setError('Please select a target place.');
      return;
    }
    if (!name.trim()) {
      setError('Please provide an access point name.');
      return;
    }

    setSubmitting(true);
    setError(null);

    let photoUrl: string | undefined = undefined;

    // 1. Upload photo if selected
    if (photoFile) {
      const { url } = await uploadAccessPointPhoto(photoFile);
      if (url) {
        photoUrl = url;
      }
    }

    // 2. Find target place coordinates for approximate access point placement
    const targetPlace = places.find((p) => p.id === selectedPlaceId);
    const coords: [number, number] = targetPlace
      ? [targetPlace.coordinates[0] + (Math.random() - 0.5) * 0.001, targetPlace.coordinates[1] + (Math.random() - 0.5) * 0.001]
      : INDONESIA_DEFAULT_CENTER;

    // 3. Create Access Point record in Supabase
    const { error: apError } = await createAccessPoint({
      placeId: selectedPlaceId,
      name,
      type,
      condition,
      availability,
      hasNoStairs,
      nearAccessibleParking,
      coordinates: coords,
      description,
      photoUrl,
    });

    setSubmitting(false);

    if (apError) {
      setError(apError.message || 'Error recording access point.');
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/place/${selectedPlaceId}`);
      }, 1800);
    }
  };

  if (authLoading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-gray-500">Checking authorization...</p>
      </div>
    );
  }

  // If user is not authenticated: Show friendly prompt as required by specs
  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-4 ring-amber-50 mx-auto mb-4">
          <LogIn className="h-6 w-6 stroke-[2.2]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Login Required to Contribute
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 mb-6">
          To maintain high data quality and protect community accessibility information, users must sign in before contributing access points.
        </p>

        <div className="space-y-3">
          <Link
            href={`/login?redirect=${encodeURIComponent('/add-access-point')}`}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <span>Sign In</span>
          </Link>
          <Link
            href={`/register?redirect=${encodeURIComponent('/add-access-point')}`}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <span>Create New Account</span>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Cancel and return to map</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-8 shadow-xl">
      {/* Top Header with Prominent User-Friendly Cancel Button */}
      <div className="mb-5 sm:mb-6 flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Tambah Titik Akses Baru
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Bantu rekan disabilitas menemukan ramp, lift, dan akses ramah disabilitas.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer"
          title="Batal dan kembali ke peta"
        >
          <X className="h-4 w-4 text-gray-500" />
          <span>Batal</span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 sm:mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 sm:mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>
            Titik akses berhasil ditambahkan! Tercatat sebagai belum diverifikasi. Mengalihkan ke halaman tempat...
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Target Place Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Pilih Tempat Tujuan *
          </label>
          <select
            value={selectedPlaceId}
            onChange={(e) => setSelectedPlaceId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 sm:p-3 text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 min-h-[44px]"
          >
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name} ({place.category})
              </option>
            ))}
          </select>
        </div>

        {/* Access Point Name */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Nama Titik Akses *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="contoh: Ramp Sisi Barat Pintu Otomatis"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 sm:p-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 min-h-[44px]"
          />
        </div>

        {/* Type Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Tipe Fasilitas Akses *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'ramp', label: 'Ramp', icon: Accessibility },
              { id: 'elevator', label: 'Lift', icon: ArrowUpDown },
              { id: 'accessible_toilet', label: 'Toilet Disabilitas', icon: Bath },
              { id: 'accessible_parking', label: 'Parkir Disabilitas', icon: Car },
              { id: 'accessible_entrance', label: 'Pintu Tanpa Tangga', icon: DoorOpen },
              { id: 'priority_seating', label: 'Kursi Prioritas', icon: Armchair },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = type === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id as AccessPointType)}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 sm:p-3 text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:bg-gray-100/50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Condition & Availability Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Kondisi Fisik
            </label>
            <select
              value={condition}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCondition(e.target.value as 'good' | 'fair' | 'poor')}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 min-h-[44px]"
            >
              <option value="good">Baik (Mulus & Terawat)</option>
              <option value="fair">Cukup (Bisa dipakai dengan hati-hati)</option>
              <option value="poor">Kurang (Perlu pendamping)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Status Ketersediaan
            </label>
            <select
              value={availability}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAvailability(e.target.value as 'available' | 'unavailable' | 'unknown')}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 min-h-[44px]"
            >
              <option value="available">Tersedia / Dapat Digunakan</option>
              <option value="unavailable">Ditutup Sementara</option>
              <option value="unknown">Belum Diketahui</option>
            </select>
          </div>
        </div>

        {/* Checkbox Options */}
        <div className="space-y-2.5 rounded-xl sm:rounded-2xl bg-gray-50 p-3 sm:p-4 border border-gray-100">
          <label className="flex items-start sm:items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={hasNoStairs}
              onChange={(e) => setHasNoStairs(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 sm:mt-0"
            />
            <span className="text-xs font-semibold text-gray-800">
              Tanpa tangga sama sekali (jalur landai atau rata)
            </span>
          </label>

          <label className="flex items-start sm:items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={nearAccessibleParking}
              onChange={(e) => setNearAccessibleParking(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 sm:mt-0"
            />
            <span className="text-xs font-semibold text-gray-800">
              Dekat dengan area parkir disabilitas (&lt;50 meter)
            </span>
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Petunjuk Arah / Catatan Tambahan
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="contoh: Terletak di sisi barat gedung dekat parkiran motor, ada tombol otomatis pembuka pintu..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 sm:p-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {/* Optional Photo Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Unggah Foto Bukti (Opsional)
          </label>

          {photoPreview ? (
            <div className="relative aspect-video max-h-48 w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black cursor-pointer"
                title="Hapus foto"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 sm:p-6 cursor-pointer hover:bg-gray-100/50 transition-colors">
              <Camera className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400 mb-1" />
              <span className="text-xs font-semibold text-gray-700 text-center">
                Ketuk untuk unggah foto akses atau ramp
              </span>
              <span className="text-[11px] text-gray-400 mt-0.5">
                PNG, JPG atau WebP (maks 5MB)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2 sm:pt-3">
          <button
            type="submit"
            disabled={submitting || success}
            className="w-full sm:w-auto flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 cursor-pointer transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Kirim Titik Akses</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddAccessPointPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-3.5 sm:p-8 pb-16">
      <Suspense fallback={<div className="text-center text-sm text-gray-500 py-16">Memuat formulir...</div>}>
        <AddAccessPointForm />
      </Suspense>
    </div>
  );
}

