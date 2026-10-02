'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header/Header';
import { AccessibilityFilters } from '@/components/filters/AccessibilityFilters';
import { WayinMap } from '@/components/map/WayinMap';
import { PlacePreviewCard } from '@/components/place/PlacePreviewCard';
import { MapControls } from '@/components/map/MapControls';
import { MapLegend } from '@/components/map/MapLegend';
import { supabase, fetchPlaces } from '@/lib/supabase';
import { MOCK_PLACES } from '@/lib/mock-data';
import { Place, AccessPointType } from '@/types';
import { Info, MapPin } from 'lucide-react';

export default function ExplorePage() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>(MOCK_PLACES);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(true);

  // User Device Geolocation [lng, lat]
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Map action triggers
  const [zoomAction, setZoomAction] = useState<number>(0);
  const [recenterAction, setRecenterAction] = useState<number>(0);

  // Request & track user's live device location
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    let watchId: number | null = null;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude]);
      },
      (err) => {
        console.warn('Geolocation permission not granted or unavailable:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude]);
      },
      (err) => {
        console.warn('Geolocation watch error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Initial load + Supabase Realtime subscription
  useEffect(() => {
    let isMounted = true;

    async function fetchAndSetPlaces() {
      try {
        const data = await fetchPlaces();
        if (!isMounted) return;
        const nextPlaces = data.length > 0 ? data : MOCK_PLACES;
        setPlaces(nextPlaces);
        setSelectedPlaceId((currentId) => {
          if (currentId && nextPlaces.some((p) => p.id === currentId)) {
            return currentId;
          }
          return nextPlaces[0]?.id ?? null;
        });
      } catch {
        if (!isMounted) return;
        setPlaces(MOCK_PLACES);
        setSelectedPlaceId(MOCK_PLACES[0]?.id ?? null);
      } finally {
        if (isMounted) {
          setIsLoadingPlaces(false);
        }
      }
    }

    void fetchAndSetPlaces();

    // Listen to live database changes from Supabase (INSERT, UPDATE, DELETE)
    const channel = supabase
      .channel('wayin-realtime-places')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'places' },
        () => {
          if (isMounted) {
            void fetchAndSetPlaces();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'access_points' },
        () => {
          if (isMounted) {
            void fetchAndSetPlaces();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter + sort places based on search query and accessibility feature filter.
  // When a search query is present, results are sorted alphabetically so that
  // e.g. "Universitas Gunadarma" appears before "Universitas Indonesia".
  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filtered = places.filter((place) => {
      const matchesSearch =
        q === '' ||
        place.name.toLowerCase().includes(q) ||
        place.category.toLowerCase().includes(q) ||
        place.address.toLowerCase().includes(q);

      let matchesFilter = true;
      if (selectedFilter !== 'all') {
        const feat = selectedFilter as AccessPointType;
        matchesFilter =
          (Array.isArray(place.primaryFeatures) && place.primaryFeatures.includes(feat)) ||
          (Array.isArray(place.accessPoints) && place.accessPoints.some((ap) => ap.type === feat));
      }

      return matchesSearch && matchesFilter;
    });

    // Sort alphabetically when user is actively searching, so multiple results
    // for the same keyword (e.g. "universitas") are ordered A→Z by name.
    if (q !== '') {
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    }

    return filtered;
  }, [places, searchQuery, selectedFilter]);

  // When the search query is non-empty, derive the fly-to target from the top
  // alphabetical result purely as derived state — no setState in effects.
  const flyToCoordinates = useMemo(() => {
    const q = searchQuery.trim();
    if (q === '' || filteredPlaces.length === 0) return null;
    const topPlace = filteredPlaces[0];
    // Use searchQuery.length as a pure discriminator (changes when query changes)
    return {
      lng: topPlace.coordinates[0],
      lat: topPlace.coordinates[1],
      ts: searchQuery.length,
    };
  }, [searchQuery, filteredPlaces]);

  // Sync selected place: prefer user-chosen ID, else top filtered result.
  // Done as memoized derivation instead of a cascading setState effect.
  const selectedPlace = useMemo(() => {
    if (selectedPlaceId) {
      const match = filteredPlaces.find((p) => p.id === selectedPlaceId);
      if (match) return match;
    }
    return filteredPlaces[0] || null;
  }, [filteredPlaces, selectedPlaceId]);

  // Hide the preview card when the selected place is filtered out of the results
  const isSelectedPlaceVisible = useMemo(() => {
    if (!selectedPlace) return false;
    return filteredPlaces.some((p) => p.id === selectedPlace.id);
  }, [filteredPlaces, selectedPlace]);

  const handleSelectPlace = (place: Place) => {
    setSelectedPlaceId(place.id);
    setIsCardVisible(true);
  };

  const handleZoomIn = () => {
    setZoomAction((prev) => (prev > 0 ? prev + 1 : 1));
  };

  const handleZoomOut = () => {
    setZoomAction((prev) => (prev < 0 ? prev - 1 : -1));
  };

  const handleRecenter = () => {
    setRecenterAction((prev) => prev + 1);
  };

  const handleViewDetails = (placeId: string) => {
    router.push(`/place/${placeId}`);
  };

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-gray-50 text-gray-900 font-sans antialiased">
      {/* Top Header Navigation */}
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Main Map Viewport */}
      <main className="relative flex-1 w-full h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden">
        {/* Full-screen Mapbox / Interactive Canvas */}
        <WayinMap
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onSelectPlace={handleSelectPlace}
          zoomAction={zoomAction}
          recenterAction={recenterAction}
          flyToCoordinates={flyToCoordinates}
          userLocation={userLocation}
        />

        {/* Floating Accessibility Filter Bar */}
        <div className="absolute top-2.5 left-3 right-14 sm:right-auto sm:top-4 sm:left-6 z-20 pointer-events-none sm:pointer-events-auto">
          <div className="pointer-events-auto">
            <AccessibilityFilters
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
              filteredCount={filteredPlaces.length}
            />
          </div>
        </div>

        {/* Floating Map Controls (Zoom in/out, Recenter) */}
        <div className="absolute top-2.5 right-3 sm:top-4 sm:right-6 z-20">
          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onRecenter={handleRecenter}
            hasUserLocation={Boolean(userLocation)}
          />
        </div>

        {/* Floating Map Legend (Bottom Right) */}
        <div className="absolute bottom-6 right-6 z-20 hidden md:flex">
          <MapLegend />
        </div>

        {/* Loading Places Badge */}
        {isLoadingPlaces && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur-md text-xs sm:text-sm font-medium text-gray-700">
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            <span>Memuat data tempat&hellip;</span>
          </div>
        )}

        {/* No Results Floating Badge */}
        {!isLoadingPlaces && filteredPlaces.length === 0 && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur-md text-xs sm:text-sm font-medium text-gray-700">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              Tidak ada tempat yang cocok
              {searchQuery ? ` dengan "${searchQuery}"` : ''}
              {selectedFilter !== 'all' ? ` dan filter "${selectedFilter}"` : ''}.
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
              }}
              className="ml-2 font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}

        {/* Floating Place Preview Card (Bottom Left on Desktop, Sheet on Mobile) */}
        {isCardVisible && isSelectedPlaceVisible && selectedPlace && (
          <div className="absolute bottom-0 left-0 right-0 sm:bottom-6 sm:left-6 sm:right-auto z-20">
            <PlacePreviewCard
              place={selectedPlace}
              onClose={() => setIsCardVisible(false)}
              onViewDetails={handleViewDetails}
              userLocation={userLocation}
            />
          </div>
        )}

        {/* Re-open Card Pill if Dismissed */}
        {!isCardVisible && isSelectedPlaceVisible && selectedPlace && (
          <button
            type="button"
            onClick={() => setIsCardVisible(true)}
            className="absolute bottom-4 left-3 right-3 sm:right-auto sm:bottom-6 sm:left-6 z-20 flex items-center justify-center sm:justify-start gap-2 rounded-full border border-gray-200 bg-white/95 px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-bold text-gray-800 shadow-xl backdrop-blur-md hover:bg-gray-50 transition-all cursor-pointer"
          >
            <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="truncate">Tampilkan {selectedPlace.name}</span>
          </button>
        )}
      </main>
    </div>
  );
}
