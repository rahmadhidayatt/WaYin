'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Plus, User, X, LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const router = useRouter();
  const { user, profile, signOut, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleAddAccessPoint = () => {
    router.push(user ? '/add-access-point' : '/login?redirect=/add-access-point');
  };

  const handleProfileClick = () => {
    if (user) {
      setShowUserMenu((v) => !v);
    } else {
      router.push('/login');
    }
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
    router.push('/');
  };

  const userInitial =
    profile?.fullName?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    'U';

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white/95 px-3 sm:px-6 backdrop-blur-md shadow-sm">
      {/* Brand + Search */}
      <div className="flex flex-1 items-center gap-2 sm:gap-6 max-w-3xl min-w-0">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center shrink-0 select-none focus:outline-none"
          aria-label="WAYIN home"
        >
          <Image
            src="/wayin-logo.png"
            alt="WAYIN"
            width={128}
            height={40}
            className="h-7 sm:h-9 w-auto object-contain"
            priority
          />
        </button>

        <div className="relative flex-1 min-w-0 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari tempat..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-1.5 sm:py-2 pl-8 sm:pl-9 pr-8 sm:pr-9 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 transition-all hover:bg-gray-100/70 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
            aria-label="Cari tempat"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600"
              aria-label="Hapus pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden sm:flex items-center pr-3">
              <span className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 shadow-sm">⌘K</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-2">
        <button
          type="button"
          onClick={handleAddAccessPoint}
          className="flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.98]"
          aria-label="Tambah Titik Akses"
          title="Tambah Titik Akses"
        >
          <Plus className="h-4 w-4 text-blue-600 stroke-[2.5]" />
          <span className="hidden sm:inline">Tambah Titik Akses</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={handleProfileClick}
            disabled={loading}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-2 ring-blue-100/80 transition-all hover:bg-blue-100 hover:ring-blue-200 focus:outline-none active:scale-95 font-bold text-xs sm:text-sm"
            aria-label={user ? 'Menu pengguna' : 'Masuk'}
          >
            {user ? userInitial : <User className="h-4 w-4 stroke-[2.2]" />}
          </button>

          {showUserMenu && user && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {profile?.fullName || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-gray-400" />
                    Keluar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

