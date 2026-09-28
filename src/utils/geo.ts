/**
 * Geospatial calculation utility for Enterprise Geofenced Attendance
 */

// Earth's radius in meters
const EARTH_RADIUS_METERS = 6371000;

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c * 10) / 10;
}

export interface GeofenceValidationResult {
  isInside: boolean;
  distanceMeters: number;
  radiusMeters: number;
  accuracyMeters: number;
  accuracyAcceptable: boolean;
  verdict: 'VERIFIED' | 'OUTSIDE' | 'LOW_ACCURACY' | 'MOCK_DETECTED';
  message: string;
}

export function validateGeofence(
  userLat: number,
  userLng: number,
  accuracyMeters: number,
  officeLat: number,
  officeLng: number,
  radiusMeters: number,
  maxAccuracyMeters: number = 50,
  isMockLocation: boolean = false
): GeofenceValidationResult {
  if (isMockLocation) {
    return {
      isInside: false,
      distanceMeters: 0,
      radiusMeters,
      accuracyMeters,
      accuracyAcceptable: false,
      verdict: 'MOCK_DETECTED',
      message: 'Suspicious fake GPS / mock location detected by device integrity check.',
    };
  }

  const distance = calculateDistanceMeters(userLat, userLng, officeLat, officeLng);
  const accuracyAcceptable = accuracyMeters <= maxAccuracyMeters;

  if (!accuracyAcceptable) {
    return {
      isInside: distance <= radiusMeters,
      distanceMeters: distance,
      radiusMeters,
      accuracyMeters,
      accuracyAcceptable: false,
      verdict: 'LOW_ACCURACY',
      message: `GPS signal accuracy too weak (±${Math.round(accuracyMeters)}m). Allowed maximum is ±${maxAccuracyMeters}m. Please step near a window or outdoors.`,
    };
  }

  if (distance <= radiusMeters) {
    return {
      isInside: true,
      distanceMeters: distance,
      radiusMeters,
      accuracyMeters,
      accuracyAcceptable: true,
      verdict: 'VERIFIED',
      message: `Location verified! You are inside authorized perimeter (${distance}m from center, radius ${radiusMeters}m).`,
    };
  }

  return {
    isInside: false,
    distanceMeters: distance,
    radiusMeters,
    accuracyMeters,
    accuracyAcceptable: true,
    verdict: 'OUTSIDE',
    message: `Outside authorized office perimeter (${distance}m away, boundary is ${radiusMeters}m).`,
  };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}
