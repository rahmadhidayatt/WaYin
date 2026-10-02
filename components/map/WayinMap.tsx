'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';
import { Place } from '@/types';
import { MapPin, Info } from 'lucide-react';
import { INDONESIA_DEFAULT_CENTER, INDONESIA_DEFAULT_ZOOM } from '@/lib/mock-data';

interface WayinMapProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  zoomAction?: number;
  recenterAction?: number;
  flyToCoordinates?: { lng: number; lat: number; ts: number } | null;
  userLocation?: [number, number] | null;
}

export function WayinMap({
  places,
  selectedPlace,
  onSelectPlace,
  zoomAction,
  recenterAction,
  flyToCoordinates,
  userLocation,
}: WayinMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [hasMapboxError, setHasMapboxError] = useState(!mapboxToken);

  // Fallback interactive state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Handle external zoom controls
  useEffect(() => {
    if (zoomAction === undefined || zoomAction === 0) return;
    if (mapInstanceRef.current) {
      if (zoomAction > 0) mapInstanceRef.current.zoomIn();
      else mapInstanceRef.current.zoomOut();
    } else {
      setZoom((prev) => {
        const next = zoomAction > 0 ? prev + 0.2 : prev - 0.2;
        return Math.min(Math.max(next, 0.6), 2.5);
      });
    }
  }, [zoomAction]);

  // Handle external recenter control
  useEffect(() => {
    if (recenterAction === undefined || recenterAction === 0) return;
    if (mapInstanceRef.current) {
      const targetCenter = userLocation
        ? userLocation
        : selectedPlace
        ? selectedPlace.coordinates
        : INDONESIA_DEFAULT_CENTER;
      mapInstanceRef.current.flyTo({
        center: targetCenter,
        zoom: userLocation ? 16 : INDONESIA_DEFAULT_ZOOM,
        essential: true,
      });
    } else {
      setPan({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [recenterAction, selectedPlace, userLocation]);

  // Fly to a geocoded location from the search autocomplete
  useEffect(() => {
    if (!flyToCoordinates || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo({
      center: [flyToCoordinates.lng, flyToCoordinates.lat],
      zoom: 16,
      essential: true,
    });
  }, [flyToCoordinates]);

  // Keep the latest places/selection/callback in refs so marker rendering does
  // not have to be torn down and rebuilt on every parent render (which made
  // marker clicks land on detached elements and appear unresponsive).
  const placesRef = useRef(places);
  const selectedPlaceRef = useRef(selectedPlace);
  const onSelectPlaceRef = useRef(onSelectPlace);

  useEffect(() => {
    placesRef.current = places;
    selectedPlaceRef.current = selectedPlace;
    onSelectPlaceRef.current = onSelectPlace;
  }, [places, selectedPlace, onSelectPlace]);

const MAP_LOCATION_PIN_SVG =
  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="currentColor"/></svg>';

  // Render markers with inline styles (not Tailwind class strings — those get purged)
  const renderMapboxMarkers = useCallback(
    (map: mapboxgl.Map, mb: typeof mapboxgl) => {
      const currentPlaces = placesRef.current;
      const currentSelected = selectedPlaceRef.current;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      currentPlaces.forEach((place) => {
        if (!place.coordinates || !Array.isArray(place.coordinates) || place.coordinates.length < 2) {
          return;
        }

        const isSelected = currentSelected?.id === place.id;

        // Container element managed exclusively by Mapbox.
        // DO NOT set style.transform on el directly, as that overrides Mapbox's translate coordinates!
        const el = document.createElement('div');
        el.className = 'wayin-mapbox-marker';
        el.style.cursor = 'pointer';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `${place.name} - titik lokasi fasilitas`);
        el.title = `${place.name} (${place.category})`;

        // Inner element where hover animations, borders, and SVGs live
        const inner = document.createElement('div');
        inner.style.cursor = 'pointer';
        inner.style.transition = 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease';
        inner.style.transformOrigin = 'center center';
        inner.style.display = 'flex';
        inner.style.alignItems = 'center';
        inner.style.justifyContent = 'center';

        if (isSelected) {
          inner.style.position = 'relative';
          inner.style.width = '38px';
          inner.style.height = '38px';
          inner.style.borderRadius = '50%';
          inner.style.backgroundColor = '#1D4ED8';
          inner.style.border = '3px solid #FFFFFF';
          inner.style.boxShadow = '0 6px 18px rgba(29, 78, 216, 0.5), 0 2px 6px rgba(0, 0, 0, 0.15)';
          inner.style.color = '#FFFFFF';
          inner.innerHTML = MAP_LOCATION_PIN_SVG;

          // Pulse animation ring
          const pulse = document.createElement('span');
          pulse.style.position = 'absolute';
          pulse.style.inset = '-6px';
          pulse.style.borderRadius = '50%';
          pulse.style.backgroundColor = 'rgba(37, 99, 235, 0.35)';
          pulse.style.pointerEvents = 'none';
          pulse.style.animation = 'wayin-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite';
          pulse.style.zIndex = '-1';
          inner.appendChild(pulse);
        } else {
          inner.style.position = 'relative';
          inner.style.width = '32px';
          inner.style.height = '32px';
          inner.style.borderRadius = '50%';
          inner.style.backgroundColor = '#16A34A';
          inner.style.border = '2.5px solid #FFFFFF';
          inner.style.boxShadow = '0 3px 10px rgba(22, 163, 74, 0.35), 0 1px 3px rgba(0, 0, 0, 0.12)';
          inner.style.color = '#FFFFFF';
          inner.innerHTML = MAP_LOCATION_PIN_SVG;
        }

        // Hover effect strictly on inner element so Mapbox translate is never corrupted
        inner.addEventListener('mouseenter', () => {
          inner.style.transform = 'scale(1.2)';
          inner.style.boxShadow = isSelected
            ? '0 8px 24px rgba(29, 78, 216, 0.65)'
            : '0 6px 18px rgba(22, 163, 74, 0.55)';
          el.style.zIndex = '50';
        });

        inner.addEventListener('mouseleave', () => {
          inner.style.transform = 'scale(1)';
          inner.style.boxShadow = isSelected
            ? '0 6px 18px rgba(29, 78, 216, 0.5), 0 2px 6px rgba(0, 0, 0, 0.15)'
            : '0 3px 10px rgba(22, 163, 74, 0.35), 0 1px 3px rgba(0, 0, 0, 0.12)';
          el.style.zIndex = isSelected ? '10' : '1';
        });

        el.appendChild(inner);

        // Click handler to select place and smoothly fly map to location
        const handleClick = (e: Event) => {
          e.stopPropagation();
          onSelectPlaceRef.current(place);
          map.flyTo({
            center: place.coordinates,
            zoom: 15.5,
            essential: true,
            duration: 800,
          });
        };

        el.addEventListener('click', handleClick);
        el.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e);
          }
        });

        const marker = new mb.Marker({ element: el, anchor: 'center' })
          .setLngLat(place.coordinates)
          .addTo(map);

        markersRef.current.push(marker);
      });
    },
    []
  );

  // Initialize Mapbox once
  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current) {
      setHasMapboxError(true);
      return;
    }

    let isMounted = true;

    async function initMapbox() {
      try {
        const mapboxglModule = await import('mapbox-gl');
        const mapboxgl = mapboxglModule.default;
        mapboxgl.accessToken = mapboxToken as string;
        if (!mapContainerRef.current || !isMounted) return;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: INDONESIA_DEFAULT_CENTER,
          zoom: INDONESIA_DEFAULT_ZOOM,
          attributionControl: false,
        });

        mapInstanceRef.current = map;
        // Mapbox emits non-fatal 'error' events for individual tile/style
        // requests. Tearing the whole map down for those blanked the live map
        // and replaced it with the SVG fallback, so only bail out on errors
        // that actually break rendering.
        map.on('error', (e: { error?: Error & { status?: number } }) => {
          if (!isMounted) return;
          const err = e?.error;
          const status = err?.status;
          const fatal =
            err?.name === 'MapboxError' && (status === 401 || status === 403) ||
            status === 401 ||
            status === 403 ||
            /access token|unauthorized|forbidden/i.test(err?.message || '');
          if (fatal) setHasMapboxError(true);
          else console.warn('Mapbox non-fatal error:', err?.message || e);
        });
        map.once('load', () => { if (isMounted) renderMapboxMarkers(map, mapboxgl); });
      } catch (err) {
        console.warn('Mapbox init failed, using fallback:', err);
        if (isMounted) setHasMapboxError(true);
      }
    }

    initMapbox();

    return () => {
      isMounted = false;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  // Render / update user location Red Dot marker
  useEffect(() => {
    if (!mapInstanceRef.current || hasMapboxError) return;
    const map = mapInstanceRef.current;

    if (!userLocation || !Array.isArray(userLocation) || userLocation.length < 2) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    import('mapbox-gl').then((mbModule) => {
      const mb = mbModule.default;
      if (!mapInstanceRef.current) return;

      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'wayin-user-marker';
        el.setAttribute('role', 'region');
        el.setAttribute('aria-label', 'Lokasi Anda saat ini');
        el.title = 'Lokasi Anda saat ini';

        const inner = document.createElement('div');
        inner.style.position = 'relative';
        inner.style.width = '20px';
        inner.style.height = '20px';
        inner.style.borderRadius = '50%';
        inner.style.backgroundColor = '#DC2626';
        inner.style.border = '3.5px solid #FFFFFF';
        inner.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.1), 0 3px 12px rgba(220, 38, 38, 0.6)';
        inner.style.display = 'flex';
        inner.style.alignItems = 'center';
        inner.style.justifyContent = 'center';

        // Pulse radar ring around user dot
        const pulse = document.createElement('span');
        pulse.style.position = 'absolute';
        pulse.style.inset = '-10px';
        pulse.style.borderRadius = '50%';
        pulse.style.backgroundColor = 'rgba(239, 68, 68, 0.35)';
        pulse.style.pointerEvents = 'none';
        pulse.style.animation = 'wayin-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite';
        pulse.style.zIndex = '-1';
        inner.appendChild(pulse);

        // Center bright dot inside
        const centerDot = document.createElement('span');
        centerDot.style.width = '4px';
        centerDot.style.height = '4px';
        centerDot.style.borderRadius = '50%';
        centerDot.style.backgroundColor = '#FFFFFF';
        inner.appendChild(centerDot);

        el.appendChild(inner);

        userMarkerRef.current = new mb.Marker({ element: el, anchor: 'center' })
          .setLngLat(userLocation)
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat(userLocation);
      }
    });
  }, [userLocation, hasMapboxError]);

  // Re-render markers when places/selection changes
  useEffect(() => {
    if (mapInstanceRef.current && !hasMapboxError) {
      const map = mapInstanceRef.current;
      if (map) {
        import('mapbox-gl').then((m) => renderMapboxMarkers(map, m.default));
      }
    }
  }, [places, selectedPlace, hasMapboxError, renderMapboxMarkers]);

  // Fallback drag/wheel handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPan({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
  };
  const handleMouseUp = () => { isDraggingRef.current = false; };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.min(Math.max(e.deltaY < 0 ? prev + 0.1 : prev - 0.1, 0.6), 2.5));
  };

  // Fallback canvas positions for 12 Jakarta places
  const fallbackPositions = [
    { left: '50%', top: '46%' }, { left: '48%', top: '40%' },
    { left: '70%', top: '62%' }, { left: '32%', top: '68%' },
    { left: '58%', top: '72%' }, { left: '60%', top: '30%' },
    { left: '25%', top: '78%' }, { left: '38%', top: '38%' },
    { left: '52%', top: '58%' }, { left: '55%', top: '64%' },
    { left: '36%', top: '56%' }, { left: '28%', top: '64%' },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden select-none bg-[#e8ece9]">
      {/* Ping keyframe for selected marker pulse */}
      <style>{`@keyframes wayin-ping{75%,100%{transform:scale(2);opacity:0;}}`}</style>

      {mapboxToken && !hasMapboxError ? (
        <div ref={mapContainerRef} className="h-full w-full" />
      ) : (
        /* Graceful fallback: interactive SVG canvas */
        <div
          className="relative h-full w-full cursor-grab active:cursor-grabbing overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-1.5 rounded-full bg-white/90 border border-gray-200 px-3 py-1 shadow-sm backdrop-blur-sm text-[11px] font-medium text-gray-600">
            <Info className="h-3.5 w-3.5 text-blue-600" />
            <span>Mode Pratinjau Peta</span>
          </div>

          <div
            className="absolute inset-0 transition-transform duration-75 ease-out origin-center"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {/* Jakarta Pusat SVG base map */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
              <rect width="1440" height="900" fill="#EDF1EC" />
              <ellipse cx="720" cy="450" rx="200" ry="160" fill="#DCE7D8" />
              <ellipse cx="280" cy="200" rx="180" ry="120" fill="#DCE7D8" />
              <ellipse cx="1200" cy="680" rx="150" ry="100" fill="#DCE7D8" />
              <ellipse cx="1350" cy="820" rx="220" ry="140" fill="#DBEAFE" />
              <g stroke="#FFFFFF" strokeWidth="28" strokeLinecap="round">
                <line x1="-50" y1="450" x2="1500" y2="450" />
                <line x1="720" y1="-50" x2="720" y2="950" />
                <line x1="-50" y1="600" x2="1500" y2="500" />
                <line x1="200" y1="-50" x2="1100" y2="950" />
                <line x1="1000" y1="-50" x2="900" y2="950" />
              </g>
              <g stroke="#E2E8E0" strokeWidth="1.5" strokeDasharray="6 8">
                <line x1="-50" y1="450" x2="1500" y2="450" />
                <line x1="720" y1="-50" x2="720" y2="950" />
              </g>
              <text x="300" y="443" fill="#9CA3AF" fontSize="11" fontWeight="600" letterSpacing="0.05em">JL. MEDAN MERDEKA</text>
              <text x="730" y="380" fill="#9CA3AF" fontSize="11" fontWeight="600" letterSpacing="0.05em">JL. THAMRIN</text>
              <text x="820" y="600" fill="#9CA3AF" fontSize="11" fontWeight="600" letterSpacing="0.05em">JL. DIPONEGORO</text>
            </svg>

            {/* Fallback markers */}
            <div className="absolute inset-0 pointer-events-none">
              {places.map((place, idx) => {
                const isSelected = selectedPlace?.id === place.id;
                const pos = fallbackPositions[idx % fallbackPositions.length];
                return (
                  <div
                    key={place.id}
                    className="absolute pointer-events-auto cursor-pointer transition-all duration-150 hover:scale-110 active:scale-95"
                    style={{ left: pos.left, top: pos.top, transform: 'translate(-50%, -50%)' }}
                    onClick={(e) => { e.stopPropagation(); onSelectPlace(place); }}
                    role="button"
                    aria-label={`Pilih ${place.name}`}
                  >
                    {isSelected ? (
                      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', top: '-4px', left: '-4px', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(59,130,246,0.25)', animation: 'wayin-ping 1.2s cubic-bezier(0,0,0.2,1) infinite' }} />
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2563EB', border: '3px solid white', boxShadow: '0 4px 16px rgba(37,99,235,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                          <MapPin style={{ width: '18px', height: '18px', color: 'white', strokeWidth: 2.4 }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#16A34A', border: '2.5px solid white', boxShadow: '0 2px 8px rgba(22,163,74,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin style={{ width: '14px', height: '14px', color: 'white', strokeWidth: 2.4 }} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* User Location marker in fallback mode */}
              {userLocation && (
                <div
                  className="absolute pointer-events-auto z-10"
                  style={{ left: '49%', top: '51%', transform: 'translate(-50%, -50%)' }}
                  title="Lokasi Anda saat ini"
                  role="region"
                  aria-label="Lokasi Anda saat ini"
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ position: 'absolute', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239,68,68,0.35)', animation: 'wayin-ping 2s cubic-bezier(0,0,0.2,1) infinite' }} />
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#DC2626', border: '3px solid white', boxShadow: '0 2px 10px rgba(220,38,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'white' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

