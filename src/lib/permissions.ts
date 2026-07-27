/**
 * Runtime Permissions Utilities
 * 
 * Ζητά άδειες συσκευής με σαφή επεξήγηση του λόγου
 */

export type PermissionType = 'geolocation' | 'camera' | 'microphone' | 'notifications';

interface PermissionContext {
  type: PermissionType;
  reason: string;
  feature: string;
}

const PERMISSION_CONTEXTS: Record<PermissionType, { title: string; description: string }> = {
  geolocation: {
    title: 'Πρόσβαση Τοποθεσίας',
    description:
      'Η εφαρμογή χρειάζεται την τοποθεσία σας για να:\n' +
      '• Σας δείξει τα κοντινότερα καταστήματα\n' +
      '• Υπολογίσει τα έξοδα παράδοσης\n' +
      '• Βρει τοπικούς παραγωγούς στην περιοχή σας',
  },
  camera: {
    title: 'Πρόσβαση Κάμερας',
    description:
      'Η εφαρμογή χρειάζεται την κάμερα σας για να:\n' +
      '• Λάβετε φωτογραφίες προϊόντων\n' +
      '• Κάνετε video κλήσεις με αγρότες\n' +
      '• Επαληθεύσετε τη ταυτότητά σας (αν χρειαστεί)',
  },
  microphone: {
    title: 'Πρόσβαση Μικροφώνου',
    description:
      'Η εφαρμογή χρειάζεται το μικρόφωνό σας για να:\n' +
      '• Κάνετε audio κλήσεις με αγρότες\n' +
      '• Ηχογραφήσετε ανατροφοδότηση',
  },
  notifications: {
    title: 'Ειδοποιήσεις',
    description:
      'Η εφαρμογή χρειάζεται την άδεια για ειδοποιήσεις για να:\n' +
      '• Σας ειδοποιήσει όταν ένας αγρότης δεχτεί το αίτημά σας\n' +
      '• Σας ενημερώσει για νέα προϊόντα που ταιριάζουν στο προφίλ σας\n' +
      '• Σας ειδοποιήσει για ενημερώσεις παραγγελιών',
  },
};

/**
 * Ζητά μια δικαίωση συσκευής με σαφή ανακοίνωση
 * @param type Τύπος δικαιώματος (geolocation, camera, κ.λ.)
 * @param reason Σύντομη περιγραφή του λόγου
 * @returns Promise<boolean> true αν εγκρίθηκε, false αν αρνήθηκε
 */
export async function requestPermissionWithContext(
  type: PermissionType,
  reason?: string
): Promise<boolean> {
  // Ελέγχουμε ότι είμαστε στο browser
  if (typeof window === 'undefined') {
    return false;
  }

  // Εμφάνιση ανακοίνωσης με σαφή επεξήγηση
  const context = PERMISSION_CONTEXTS[type];
  const explanation = reason || context.description;

  // Δημιουργία custom modal (χωρίς native alert που είναι δύσκολο να σχεδιαστεί)
  const userConfirmed = window.confirm(
    `${context.title}\n\n${explanation}\n\nΘέλετε να δώσετε άδεια;`
  );

  if (!userConfirmed) {
    console.log(`Permission rejected for ${type}`);
    return false;
  }

  try {
    switch (type) {
      case 'geolocation':
        return await requestGeolocation();
      case 'notifications':
        return await requestNotifications();
      case 'camera':
        return await requestCamera();
      case 'microphone':
        return await requestMicrophone();
      default:
        return false;
    }
  } catch (error) {
    console.error(`Permission request failed for ${type}:`, error);
    return false;
  }
}

/**
 * Ζητά άδεια Τοποθεσίας
 */
async function requestGeolocation(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        console.log('Geolocation permission granted');
        resolve(true);
      },
      () => {
        console.log('Geolocation permission denied');
        resolve(false);
      }
    );
  });
}

/**
 * Ζητά άδεια Ειδοποιήσεων (Notifications)
 */
async function requestNotifications(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Notification permission request failed:', error);
      return false;
    }
  }

  return false;
}

/**
 * Ζητά άδεια Κάμερας
 */
async function requestCamera(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Σταματήστε το stream αμέσως
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
}

/**
 * Ζητά άδεια Μικροφώνου
 */
async function requestMicrophone(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Σταματήστε το stream αμέσως
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Ελέγχει αν μια δικαίωση έχει ήδη δοθεί
 * (Χρησιμοποιούμε την Permissions API όπου διατίθεται)
 */
export async function checkPermissionStatus(type: PermissionType): Promise<'granted' | 'denied' | 'unknown'> {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  if (!('permissions' in navigator)) {
    return 'unknown';
  }

  const permissionName: PermissionName | null = (() => {
    switch (type) {
      case 'geolocation':
        return 'geolocation';
      case 'notifications':
        return 'notifications';
      case 'camera':
        return 'camera';
      case 'microphone':
        return 'microphone';
      default:
        return null;
    }
  })();

  if (!permissionName) {
    return 'unknown';
  }

  try {
    const result = await navigator.permissions.query({ name: permissionName });
    // Map 'prompt' to 'unknown' to match our return type
    const state = result.state as 'granted' | 'denied' | 'prompt';
    if (state === 'prompt') return 'unknown';
    return state;
  } catch (error) {
    console.warn(`Could not check permission status for ${type}:`, error);
    return 'unknown';
  }
}

/**
 * Hook για χρήση με React
 * Παράδειγμα: const { request } = usePermissions();
 *              request('geolocation').then(granted => ...)
 */
export function usePermissions() {
  return {
    request: requestPermissionWithContext,
    check: checkPermissionStatus,
  };
}
