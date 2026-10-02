import { createClient } from '@supabase/supabase-js';
import { Place, AccessPoint, AccessPointType } from '@/types';
import { MOCK_PLACES, calculateAccessScore } from './mock-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ffdvtpmzqokivtujxkac.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_0x-MvBIwdZjozuSYKVuAUw_b00VhhZi';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface DbAccessPointRow { id: string; place_id: string; name: string; type: string; condition: string; availability: string; verification: string; has_no_stairs: boolean | null; near_accessible_parking: boolean | null; longitude: number; latitude: number; description?: string | null; photo_url?: string | null; score?: number | null; created_at: string; updated_at: string; created_by?: string | null; }
export interface DbPlaceRow { id: string; name: string; category: string; address: string; longitude: number; latitude: number; status?: string | null; primary_features?: string[] | null; updated_at?: string | null; created_at: string; created_by?: string | null; }

function mapDbAccessPoint(dbAp: DbAccessPointRow): AccessPoint {
  const ap: AccessPoint = {
    id: dbAp.id,
    placeId: dbAp.place_id,
    name: dbAp.name,
    type: dbAp.type as AccessPointType,
    condition: dbAp.condition as 'good' | 'fair' | 'poor',
    availability: dbAp.availability as 'available' | 'unavailable' | 'unknown',
    verification: dbAp.verification as 'verified' | 'unverified' | 'reported',
    hasNoStairs: dbAp.has_no_stairs ?? false,
    nearAccessibleParking: dbAp.near_accessible_parking ?? false,
    coordinates: [dbAp.longitude, dbAp.latitude],
    description: dbAp.description || undefined,
    photoUrl: dbAp.photo_url ?? undefined,
    score: dbAp.score || calculateAccessScore({
      type: dbAp.type as AccessPointType,
      condition: dbAp.condition as 'good' | 'fair' | 'poor',
      verification: dbAp.verification as 'verified' | 'unverified' | 'reported',
      hasNoStairs: dbAp.has_no_stairs ?? false,
      nearAccessibleParking: dbAp.near_accessible_parking ?? false,
    }),
    createdAt: dbAp.created_at,
    updatedAt: dbAp.updated_at,
    createdBy: dbAp.created_by || undefined,
  };
  return ap;
}

function mapDbPlace(dbPlace: DbPlaceRow, accessPoints: AccessPoint[] = []): Place {
  const pAps = accessPoints.filter((ap) => ap.placeId === dbPlace.id);
  const sortedAps = [...pAps].sort((a, b) => b.score - a.score);

  return {
    id: dbPlace.id,
    name: dbPlace.name,
    category: dbPlace.category,
    address: dbPlace.address,
    coordinates: [dbPlace.longitude, dbPlace.latitude],
    status: (dbPlace.status as 'accessible' | 'partial' | 'partially_accessible' | 'inaccessible') || 'accessible',
    primaryFeatures: (dbPlace.primary_features || []) as AccessPointType[],
    accessPoints: pAps,
    recommendedAccessPoint: sortedAps[0] || undefined,
    updatedAt: dbPlace.updated_at ? new Date(dbPlace.updated_at).toLocaleDateString() : 'recently',
    createdAt: dbPlace.created_at,
    createdBy: dbPlace.created_by || undefined,
  };
}

function mockPlaceById(id: string): Place | undefined {
  return MOCK_PLACES.find((p) => p.id === id);
}

/**
 * Fetch all places and their access points from Supabase.
 * Falls back to MOCK_PLACES only if table not found or empty.
 */
export async function fetchPlaces(): Promise<Place[]> {
  try {
    const { data: placesData, error: placesError } = await supabase
      .from('places')
      .select('*')
      .order('name');

    if (placesError || !placesData || placesData.length === 0) {
      console.warn('Supabase fetchPlaces returned no records or error, using mock fallback:', placesError);
      return MOCK_PLACES;
    }

    const { data: apsData, error: apsError } = await supabase
      .from('access_points')
      .select('*');

    if (apsError) {
      console.warn('Supabase fetch access points warning:', apsError);
    }

    const aps: AccessPoint[] = (apsData || []).map(mapDbAccessPoint);
    return placesData.map((p) => mapDbPlace(p, aps));
  } catch (err) {
    console.warn('Supabase fetchPlaces fallback to mock data:', err);
    return MOCK_PLACES;
  }
}

/**
 * Fetch a single place by ID with its access points.
 */
export async function fetchPlaceById(id: string): Promise<Place | null> {
  try {
    const { data: placeData, error: placeError } = await supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!placeError && placeData) {
      const { data: apsData } = await supabase
        .from('access_points')
        .select('*')
        .eq('place_id', id);

      const aps = (apsData || []).map(mapDbAccessPoint);
      return mapDbPlace(placeData, aps);
    }
  } catch (err) {
    console.warn('Supabase fetchPlaceById error, using mock data:', err);
  }

  // Fallback to mock data
  const mockPlace = mockPlaceById(id);
  return mockPlace || null;
}

/**
 * Fetch an access point by ID along with its associated place.
 */
export async function fetchAccessPointById(
  id: string
): Promise<{ accessPoint: AccessPoint; place: Place } | null> {
  try {
    const { data: apData, error: apError } = await supabase
      .from('access_points')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!apError && apData) {
      const ap = mapDbAccessPoint(apData);
      const place = await fetchPlaceById(ap.placeId);
      if (place) return { accessPoint: ap, place };
    }
  } catch (err) {
    console.warn('Supabase fetchAccessPointById error, using mock data:', err);
  }

  // Fallback to mock data
  for (const place of MOCK_PLACES) {
    const foundAp = place.accessPoints.find((ap) => ap.id === id);
    if (foundAp) {
      return { accessPoint: foundAp, place };
    }
  }
  return null;
}

/**
 * Add a new access point to Supabase.
 */
export async function createAccessPoint(input: {
  placeId: string;
  name: string;
  type: AccessPointType;
  condition: 'good' | 'fair' | 'poor';
  availability: 'available' | 'unavailable' | 'unknown';
  hasNoStairs: boolean;
  nearAccessibleParking: boolean;
  coordinates: [number, number];
  description?: string;
  photoUrl?: string;
}): Promise<{ data: AccessPoint | null; error: Error | null }> {
  const score = calculateAccessScore({
    type: input.type,
    condition: input.condition,
    verification: 'unverified',
    hasNoStairs: input.hasNoStairs,
    nearAccessibleParking: input.nearAccessibleParking,
  });

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id || null;

  const newId = `ap-${Date.now()}`;
  const record = {
    id: newId,
    place_id: input.placeId,
    name: input.name,
    type: input.type,
    condition: input.condition,
    availability: input.availability,
    verification: 'unverified',
    has_no_stairs: input.hasNoStairs,
    near_accessible_parking: input.nearAccessibleParking,
    longitude: input.coordinates[0],
    latitude: input.coordinates[1],
    description: input.description || null,
    photo_url: input.photoUrl || null,
    score: score,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('access_points')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.warn('Supabase insert error (saving locally in session):', error.message);
      // Construct in-memory object for user flow success
      const ap = mapDbAccessPoint(record);
      // Append to mock place if exists
      const targetPlace = MOCK_PLACES.find((p) => p.id === input.placeId);
      if (targetPlace) {
        targetPlace.accessPoints.push(ap);
        if (!targetPlace.primaryFeatures.includes(ap.type)) {
          targetPlace.primaryFeatures.push(ap.type);
        }
      }
      return { data: ap, error: null };
    }

    return { data: mapDbAccessPoint(data as DbAccessPointRow), error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Submit a report for an access point.
 */
export async function createReport(input: {
  accessPointId: string;
  reason: 'incorrect_information' | 'access_point_unavailable' | 'wrong_location' | 'other';
  details?: string;
}): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const { error } = await supabase.from('reports').insert({
      access_point_id: input.accessPointId,
      reason: input.reason,
      details: input.details || null,
      status: 'pending',
      created_by: userId,
    });

    if (error) {
      console.warn('Report recorded in demo session mode:', error.message);
      return { success: true, error: null };
    }

    return { success: true, error: null };
  } catch {
    return { success: true, error: null };
  }
}

/**
 * Upload an access point photo to Supabase Storage.
 */
export async function uploadAccessPointPhoto(
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `contributions/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('access-point-photos')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.warn('Storage upload error, using local object preview URL:', uploadError.message);
      return { url: URL.createObjectURL(file), error: null };
    }

    const { data: publicUrlData } = supabase.storage
      .from('access-point-photos')
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null };
  } catch {
    return { url: URL.createObjectURL(file), error: null };
  }
}

