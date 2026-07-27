export type ServiceAreaOption = {
  zip: string;
  city: string;
  municipality: string;
  label: string;
};

export const SERVICE_AREA_OPTIONS: ServiceAreaOption[] = [
  { zip: '59100', city: 'Βέροια', municipality: 'Δήμος Βέροιας', label: '59100 - Βέροια' },
  { zip: '59131', city: 'Μακροχώρι', municipality: 'Δήμος Βέροιας', label: '59131 - Μακροχώρι' },
  { zip: '59132', city: 'Βεργίνα', municipality: 'Δήμος Βέροιας', label: '59132 - Βεργίνα' },
  { zip: '59200', city: 'Νάουσα', municipality: 'Δήμος Νάουσας', label: '59200 - Νάουσα' },
  { zip: '59201', city: 'Κοπανός', municipality: 'Δήμος Νάουσας', label: '59201 - Κοπανός' },
  { zip: '59202', city: 'Στενήμαχος', municipality: 'Δήμος Νάουσας', label: '59202 - Στενήμαχος' },
  { zip: '59300', city: 'Αλεξάνδρεια', municipality: 'Δήμος Αλεξάνδρειας', label: '59300 - Αλεξάνδρεια' },
  { zip: '59331', city: 'Μελίκη', municipality: 'Δήμος Αλεξάνδρειας', label: '59331 - Μελίκη' },
  { zip: '59332', city: 'Πλατύ', municipality: 'Δήμος Αλεξάνδρειας', label: '59332 - Πλατύ' },
  { zip: '58200', city: 'Έδεσσα', municipality: 'Δήμος Έδεσσας', label: '58200 - Έδεσσα' },
  { zip: '58250', city: 'Άρνισσα', municipality: 'Δήμος Έδεσσας', label: '58250 - Άρνισσα' },
  { zip: '58400', city: 'Σκύδρα', municipality: 'Δήμος Σκύδρας', label: '58400 - Σκύδρα' },
  { zip: '58500', city: 'Άρνισσα', municipality: 'Δήμος Έδεσσας', label: '58500 - Άρνισσα (ευρύτερη περιοχή)' },
];

export function normalizeServiceAreas(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizePhoneForTel(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value.replace(/\s+/g, '');
}

export function findServiceAreaByZip(zip: string): ServiceAreaOption | undefined {
  return SERVICE_AREA_OPTIONS.find((option) => option.zip === zip);
}
