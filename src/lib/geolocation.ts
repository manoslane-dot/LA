/**
 * Geolocation & Distance Calculation Utilities
 * 
 * Χρησιμοποιείται για να υπολογίσουμε τις αποστάσεις μεταξύ του χρήστη 
 * και των περιοχών εξυπηρέτησης των παραγωγών
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
 * Λαμβάνει τη τοποθεσία του χρήστη από geolocation API
 * Αποθηκεύει στο localStorage με timestamp
 */
export async function getUserLocation(): Promise<UserLocation | null> {
  // Ελέγχουμε ότι είμαστε στο browser
  if (typeof window === 'undefined') {
    return null;
  }

  // Πρώτα ελέγχουμε αν υπάρχει αποθηκευμένη τοποθεσία (όχι παλιότερη από 1 ώρα)
  const cached = localStorage.getItem('userLocation');
  if (cached) {
    const location = JSON.parse(cached) as UserLocation;
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (location.timestamp > oneHourAgo) {
      return location;
    }
  }

  // Αν δεν υπάρχει cached ή είναι παλιά, ζητάμε νέα
  if (!navigator.geolocation) {
    console.warn('Geolocation API not available');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        // Αποθηκεύουμε για μελλοντική χρήση
        localStorage.setItem('userLocation', JSON.stringify(location));
        resolve(location);
      },
      (error) => {
        console.error('Geolocation error:', error);
        resolve(null);
      }
    );
  });
}

/**
 * Υπολογίζει την απόσταση από ένα ZIP code
 */
export function getDistanceToZip(
  userLat: number,
  userLng: number,
  zipCode: string
): number | null {
  const coords = ZIP_COORDINATES[zipCode];
  if (!coords) {
    console.warn(`No coordinates found for ZIP code: ${zipCode}`);
    return null;
  }

  return calculateDistance(userLat, userLng, coords.lat, coords.lng);
}

/**
 * Υπολογίζει την ΕΛΑΧΙΣΤΗ απόσταση από ένα array service areas
 * (π.χ., αν αγρότης εξυπηρετεί πολλές περιοχές)
 */
export function getClosestDistanceToServiceAreas(
  userLat: number,
  userLng: number,
  serviceAreas: string[]
): number | null {
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
  userLat: number,
  userLng: number,
  farmerServiceAreas: Record<string, string[]> = {}
): ProductWithDistance[] {
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
export function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null) {
    return 'Άγνωστη απόσταση';
  }

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} μ`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Ελέγχει αν υπάρχει αποθηκευμένη τοποθεσία
 */
export function hasUserLocationCached(): boolean {
  if (typeof window === 'undefined') return false;
  
  const cached = localStorage.getItem('userLocation');
  if (!cached) return false;

  const location = JSON.parse(cached) as UserLocation;
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return location.timestamp > oneHourAgo;
}

/**
 * Καθαρίζει τη αποθηκευμένη τοποθεσία
 */
export function clearUserLocation(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('userLocation');
}
