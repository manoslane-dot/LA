type GooglePlaceAutocomplete = {
  addListener: (eventName: string, handler: () => void) => void;
  getPlace: () => {
    address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
    formatted_address?: string;
  };
};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (input: HTMLInputElement, options?: Record<string, unknown>) => GooglePlaceAutocomplete;
        };
        event?: {
          clearInstanceListeners: (instance: unknown) => void;
        };
      };
    };
  }
}

let placesLibraryPromise: Promise<void> | null = null;

export interface GooglePlaceSelection {
  address: string;
  city: string;
  postalCode: string;
}

const getGooglePlacesApiKey = () => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';

const getComponentValue = (components: Array<{ long_name: string; short_name: string; types: string[] }> | undefined, type: string) =>
  components?.find((component) => component.types.includes(type))?.long_name ?? '';

export async function loadGooglePlacesLibrary() {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.google?.maps?.places) {
    return;
  }

  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    return;
  }

  if (!placesLibraryPromise) {
    placesLibraryPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => {
          placesLibraryPromise = null;
          reject(new Error('Unable to load Google Places script.'));
        }, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=el&region=GR`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        placesLibraryPromise = null;
        reject(new Error('Unable to load Google Places script.'));
      };
      document.head.appendChild(script);
    });
  }

  return placesLibraryPromise;
}

export async function attachGooglePlacesAutocomplete(
  input: HTMLInputElement | null,
  onPlaceSelected: (selection: GooglePlaceSelection) => void,
) {
  if (!input) {
    return undefined;
  }

  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    return undefined;
  }

  try {
    await loadGooglePlacesLibrary();
  } catch {
    return undefined;
  }

  if (!window.google?.maps?.places) {
    return undefined;
  }

  const autocomplete = new window.google.maps.places.Autocomplete(input, {
    types: ['address'],
    componentRestrictions: { country: 'gr' },
    fields: ['address_components', 'formatted_address'],
  });

  const placeChangedHandler = () => {
    const place = autocomplete.getPlace();
    const address = place.formatted_address?.trim() ?? '';
    const components = place.address_components;
    const city = getComponentValue(components, 'locality')
      || getComponentValue(components, 'administrative_area_level_3')
      || getComponentValue(components, 'administrative_area_level_2')
      || '';
    const postalCode = getComponentValue(components, 'postal_code');

    if (!address && !city && !postalCode) {
      return;
    }

    onPlaceSelected({
      address,
      city,
      postalCode,
    });
  };

  autocomplete.addListener('place_changed', placeChangedHandler);

  return () => {
    if (window.google?.maps?.event?.clearInstanceListeners) {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    }
  };
}
