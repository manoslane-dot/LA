/**
 * Geolocation & Distance Calculation Utilities - Optimized & Modern
 * 
 * Χρησιμοποιείται για να υπολογίσουμε τις αποστάσεις μεταξύ του χρήστη 
 * και των περιοχών εξυπηρέτησης των παραγωγών
 * 
 * ✨ Optimizations:
 * - Faster permission checks with Permissions API
 * - Dual-layer caching (sessionStorage + localStorage)
 * - Timeout handling for geolocation requests
 * - Memoized distance calculations
 */

import { SERVICE_AREA_OPTIONS } from './serviceAreas';

// GPS Coordinates για κάθε ZIP code (Β. Ελλάδα - Περιοχή Πέλλας)
const ZIP_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '59100': { lat: 40.5167, lng: 22.2167 }, // Βέροια
  '59131': { lat: 40.5500, lng: 22.1833 }, // Μακροχώρι
  '59132': { lat: 40.5000, lng: 22.2500 }, // Βεργίνα
  '59200': { lat: 40.4833, lng: 22.0500 }, // Νάουσα
  '59201': { lat: 40.5167, lng: 21.9667 }, // Κοπανός
  '59202': { lat: 40.5833, lng: 21.9333 }, // Στενήμαχος
  '59300': { lat: 40.6167, lng: 22.1333 }, // Αλεξάνδρεια
  '59331': { lat: 40.6333, lng: 22.2500 }, // Μελίκη
  '59332': { lat: 40.7000, lng: 22.1667 }, // Πλατύ
  '58200': { lat: 40.7667, lng: 22.1000 }, // Έδεσσα
  '58250': { lat: 40.8333, lng: 22.1667 }, // Άρνισσα
  '58400': { lat: 40.5500, lng: 21.8167 }, // Σκύδρα
  '58500': { lat: 40.8000, lng: 22.2000 }, // Άρνισσα (ευρύτερη περιοχή)
};

// Memoization cache για distance calculations
const DISTANCE_CACHE = new Map<string, number>();
const CACHE_KEYS = {
  USER_LOCATION: 'agro_user_location',
  SESSION_LOCATION: 'agro_session_location',
  PERMISSION_GRANTED: 'agro_geo_permission',
};
const CACHE_DURATIONS = {
  SESSION: 30 * 60 * 1000, // 30 λεπτά για sessionStorage
  LOCAL: 60 * 60 * 1000,   // 1 ώρα για localStorage
};

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Haversine formula - υπολογίζει την απόσταση μεταξύ δύο σημείων (σε km)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Ακτίνα Γης σε km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Ελέγχει τη δικαίωση τοποθεσίας χωρίς να ζητάει ξανά άδεια
 * ✨ Modern: Uses Permissions API
 */
export async function checkGeolocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (typeof window === 'undefined' || !navigator.permissions) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state as 'granted' | 'denied' | 'prompt';
  } catch (error) {
    return 'prompt';
  }
}

/**
 * Λαμβάνει τη τοποθεσία του χρήστη - ταχυτερη με timeout & dual caching
 * 
 * ✨ Optimizations:
 * - Checks both sessionStorage (fast) and localStorage (persistent)
 * - 10-second timeout for geolocation request
 * - Caches in both storage layers
 */
export async function getUserLocation(timeoutMs: number = 10000): Promise<UserLocation | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  // 1️⃣ Check sessionStorage FIRST (fastest - same session)
  const sessionCached = getLocationFromSession();
  if (sessionCached) {
    return sessionCached;
  }

  // 2️⃣ Check localStorage (persistent - 1 hour)
  const localCached = getLocationFromLocal();
  if (localCached) {
    return localCached;
  }

  // 3️⃣ Request fresh location with timeout
  if (!navigator.geolocation) {
    console.warn('Geolocation API not available');
    return null;
  }

  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let resolved = false;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      resolved = true;
    };

    // Timeout handler
    timeoutId = setTimeout(() => {
      if (!resolved) {
        console.warn('Geolocation request timeout');
        resolved = true;
        resolve(null);
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (resolved) return;
        cleanup();

        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };

        // Cache in both layers for redundancy
        try {
          sessionStorage.setItem(CACHE_KEYS.SESSION_LOCATION, JSON.stringify(location));
          localStorage.setItem(CACHE_KEYS.USER_LOCATION, JSON.stringify(location));
        } catch (e) {
          console.warn('Failed to cache location:', e);
        }

        resolve(location);
      },
      (error) => {
        if (resolved) return;
        cleanup();
        console.warn('Geolocation error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: false, // Faster (don't need GPS-level accuracy for distance)
        timeout: timeoutMs,
        maximumAge: 5 * 60 * 1000, // Accept location up to 5 min old from device
      }
    );
  });
}

/**
 * Παίρνει την τοποθεσία από sessionStorage (ταχύτατο)
 */
function getLocationFromSession(): UserLocation | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = sessionStorage.getItem(CACHE_KEYS.SESSION_LOCATION);
    if (!cached) return null;

    const location = JSON.parse(cached) as UserLocation;
    const sessionAgeMs = Date.now() - location.timestamp;

    if (sessionAgeMs < CACHE_DURATIONS.SESSION) {
      return location;
    }

    sessionStorage.removeItem(CACHE_KEYS.SESSION_LOCATION);
  } catch (e) {
    console.warn('Session location parse error:', e);
  }

  return null;
}

/**
 * Παίρνει την τοποθεσία από localStorage (1 ώρα)
 */
function getLocationFromLocal(): UserLocation | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEYS.USER_LOCATION);
    if (!cached) return null;

    const location = JSON.parse(cached) as UserLocation;
    const cacheAgeMs = Date.now() - location.timestamp;

    if (cacheAgeMs < CACHE_DURATIONS.LOCAL) {
      // Refresh in sessionStorage for fast access next time
      try {
        sessionStorage.setItem(CACHE_KEYS.SESSION_LOCATION, JSON.stringify(location));
      } catch (e) {
        // Ignore session storage errors
      }
      return location;
    }

    localStorage.removeItem(CACHE_KEYS.USER_LOCATION);
  } catch (e) {
    console.warn('Local location parse error:', e);
  }

  return null;
}

/**
 * Υπολογίζει την απόσταση από ένα ZIP code (με memoization)
 * ✨ Optimized: Caches results to avoid redundant calculations
 */
export function getDistanceToZip(
  userLat: number | null | undefined,
  userLng: number | null | undefined,
  zipCode: string
): number | null {
  // Guard against undefined or non-number values
  if (typeof userLat !== 'number' || typeof userLng !== 'number') {
    console.warn('Invalid coordinates for distance calculation:', { userLat, userLng });
    return null;
  }

  const cacheKey = `${userLat.toFixed(4)}_${userLng.toFixed(4)}_${zipCode}`;

  // Check cache first
  if (DISTANCE_CACHE.has(cacheKey)) {
    return DISTANCE_CACHE.get(cacheKey) ?? null;
  }

  const coords = ZIP_COORDINATES[zipCode];
  if (!coords) {
    console.warn(`No coordinates found for ZIP code: ${zipCode}`);
    return null;
  }

  const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
  DISTANCE_CACHE.set(cacheKey, distance);

  // Prevent cache from growing unboundedly
  if (DISTANCE_CACHE.size > 1000) {
    const firstKey = DISTANCE_CACHE.keys().next().value;
    if (firstKey) DISTANCE_CACHE.delete(firstKey);
  }

  return distance;
}

/**
 * Υπολογίζει την ΕΛΑΧΙΣΤΗ απόσταση από ένα array service areas
 * (π.χ., αν αγρότης εξυπηρετεί πολλές περιοχές)
 */
export function getClosestDistanceToServiceAreas(
  userLat: number | null | undefined,
  userLng: number | null | undefined,
  serviceAreas: string[]
): number | null {
  // Guard against undefined or non-number values
  if (typeof userLat !== 'number' || typeof userLng !== 'number') {
    console.warn('Invalid coordinates for service areas calculation:', { userLat, userLng });
    return null;
  }

  if (!serviceAreas || serviceAreas.length === 0) {
    return null;
  }

  const distances = serviceAreas
    .map((zip) => getDistanceToZip(userLat, userLng, zip))
    .filter((d): d is number => d !== null);

  if (distances.length === 0) {
    return null;
  }

  // Επιστρέφουμε την ΕΛΑΧΙΣΤΗ απόσταση (κοντινότερη περιοχή αγρότη)
  return Math.min(...distances);
}

/**
 * Ταξινομεί τα προϊόντα κατά απόσταση από τον χρήστη
 */
export interface ProductWithDistance {
  id: number;
  title: string;
  quantity: number;
  price: number;
  unit: string;
  status: string;
  farmer_id: string | null;
  distance_km?: number | null;
}

export function sortProductsByDistance(
  products: any[],
  userLat: number | null | undefined,
  userLng: number | null | undefined,
  farmerServiceAreas: Record<string, string[]> = {}
): ProductWithDistance[] {
  // Guard against undefined or non-number values
  if (typeof userLat !== 'number' || typeof userLng !== 'number') {
    console.warn('Invalid coordinates for product sorting:', { userLat, userLng });
    return products; // Return unsorted if coordinates are invalid
  }

  const productsWithDistance = products.map((product) => {
    let distance: number | null = null;

    // Αν έχουμε τις περιοχές του αγρότη, υπολογίζουμε την απόσταση
    if (product.farmer_id && farmerServiceAreas[product.farmer_id]) {
      distance = getClosestDistanceToServiceAreas(
        userLat,
        userLng,
        farmerServiceAreas[product.farmer_id]
      );
    }

    return {
      ...product,
      distance_km: distance,
    };
  });

  // Ταξινομούμε: πρώτα τα προϊόντα με γνωστή απόσταση (κατά απόσταση),
  // μετά τα άγνωστα (χωρίς service areas)
  return productsWithDistance.sort((a, b) => {
    if (a.distance_km !== null && b.distance_km !== null) {
      return a.distance_km - b.distance_km;
    }
    if (a.distance_km !== null) return -1;
    if (b.distance_km !== null) return 1;
    return 0;
  });
}

/**
 * Μορφοποιεί την απόσταση για εμφάνιση
 */
export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm === null || distanceKm === undefined || typeof distanceKm !== 'number') {
    return 'Άγνωστη απόσταση';
  }

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} μ`;
  }

  return `${(distanceKm ?? 0).toFixed(1)} km`;
}

/**
 * Ελέγχει αν υπάρχει αποθηκευμένη τοποθεσία (γρήγορα)
 * ✨ Optimized: Checks sessionStorage first (fastest)
 */
export function hasUserLocationCached(): boolean {
  if (typeof window === 'undefined') return false;

  // Check sessionStorage first (fastest)
  try {
    const sessionCached = sessionStorage.getItem(CACHE_KEYS.SESSION_LOCATION);
    if (sessionCached) {
      const location = JSON.parse(sessionCached) as UserLocation;
      const sessionAgeMs = Date.now() - location.timestamp;
      if (sessionAgeMs < CACHE_DURATIONS.SESSION) {
        return true;
      }
      sessionStorage.removeItem(CACHE_KEYS.SESSION_LOCATION);
    }
  } catch (e) {
    // Continue to localStorage check
  }

  // Fall back to localStorage
  try {
    const cached = localStorage.getItem(CACHE_KEYS.USER_LOCATION);
    if (cached) {
      const location = JSON.parse(cached) as UserLocation;
      const cacheAgeMs = Date.now() - location.timestamp;
      return cacheAgeMs < CACHE_DURATIONS.LOCAL;
    }
  } catch (e) {
    // Ignore
  }

  return false;
}

/**
 * Καθαρίζει τη αποθηκευμένη τοποθεσία (και από τα δύο layers)
 */
export function clearUserLocation(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(CACHE_KEYS.SESSION_LOCATION);
    localStorage.removeItem(CACHE_KEYS.USER_LOCATION);
    DISTANCE_CACHE.clear();
  } catch (e) {
    console.warn('Failed to clear location cache:', e);
  }
}
