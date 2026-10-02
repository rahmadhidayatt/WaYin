import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <Link href="/" className="mb-6 inline-block">
        <Image
          src="/wayin-logo.png"
          alt="WAYIN"
          width={140}
          height={44}
          className="h-10 w-auto object-contain"
          priority
        />
      </Link>

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50 mb-4">
        <MapPin className="h-8 w-8 stroke-[2.2]" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
        404 - Halaman Tidak Ditemukan
      </h1>
      <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-sm">
        Halaman atau lokasi yang Anda cari tidak tersedia atau tautan sudah berpindah.
      </p>

      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Kembali ke Peta Eksplorasi</span>
      </Link>
    </div>
  );
}
