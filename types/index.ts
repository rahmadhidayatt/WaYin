export type AccessPointType =
  | 'ramp'
  | 'elevator'
  | 'accessible_toilet'
  | 'accessible_parking'
  | 'accessible_entrance'
  | 'priority_seating';

export type Condition = 'good' | 'fair' | 'poor';

export type Availability = 'available' | 'unavailable' | 'unknown';

export type Verification = 'verified' | 'unverified' | 'reported';

export interface AccessPoint {
  id: string;
  placeId: string;
  name: string;
  type: AccessPointType;
  condition: Condition;
  availability: Availability;
  verification: Verification;
  hasNoStairs: boolean;
  nearAccessibleParking: boolean;
  coordinates: [number, number]; // [lng, lat]
  description?: string;
  photoUrl?: string;
  score: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  accessPoints: AccessPoint[];
  recommendedAccessPoint?: AccessPoint;
  updatedAt: string;
  primaryFeatures: AccessPointType[];
  status: 'accessible' | 'partial' | 'partially_accessible' | 'inaccessible';
  createdAt?: string;
  createdBy?: string;
}

export type FilterType = 'all' | AccessPointType;

export interface Report {
  id?: string;
  accessPointId: string;
  reason: 'incorrect_information' | 'access_point_unavailable' | 'wrong_location' | 'other';
  details?: string;
  status?: 'pending' | 'resolved' | 'dismissed';
  createdAt?: string;
  createdBy?: string;
}

export interface Profile {
  id: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}