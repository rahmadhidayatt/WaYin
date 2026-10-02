'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50 mb-4">
        <AlertCircle className="h-8 w-8 stroke-[2.2]" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
        Terjadi Kendala Teknis
      </h1>
      <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-sm">
        Aplikasi mengalami kendala saat memuat halaman ini. Silakan coba muat ulang atau kembali ke halaman utama peta.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Coba Lagi</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 active:scale-95 transition-all"
        >
          <Home className="h-4 w-4 text-gray-500" />
          <span>Ke Halaman Utama</span>
        </Link>
      </div>
    </div>
  );
}
