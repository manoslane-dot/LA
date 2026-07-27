'use client';

import { useEffect, useState } from 'react';
import { Shield, Bell, MapPin, Video, Mic, RotateCcw } from 'lucide-react';
import Link from 'next/link';

type ConsentPreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
};

export default function PrivacySettings() {
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      setPreferences(JSON.parse(consent));
    }
    setLoading(false);
  }, []);

  const handleSave = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const minimalConsent: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(minimalConsent);
    localStorage.setItem('cookieConsent', JSON.stringify(minimalConsent));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-emerald-700" />
            <h1 className="text-xl font-bold text-stone-900">Ρυθμίσεις Προστασίας</h1>
          </div>
          <Link
            href="/"
            className="text-stone-600 hover:text-stone-900 text-sm font-semibold"
          >
            ← Πίσω
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Notification */}
        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 animate-pulse">
            <p className="text-emerald-800 font-semibold">✓ Οι ρυθμίσεις αποθηκεύθηκαν με επιτυχία!</p>
          </div>
        )}

        {/* Cookie Preferences Section */}
        <section className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-stone-900">🍪 Δικαιώματα Cookies & Δεδομένων</h2>
          </div>

          <p className="text-stone-600 text-sm mb-5">
            Επιλέξτε τι δεδομένα και τεχνολογίες θέλετε να χρησιμοποιούμε. 
            Τα απαραίτητα cookies είναι πάντα ενεργά για τη λειτουργία της εφαρμογής.
          </p>

          <div className="space-y-4">
            {/* Essential */}
            <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="essential"
                  checked={preferences.essential}
                  disabled
                  className="h-5 w-5 mt-0.5 accent-emerald-700 cursor-not-allowed"
                />
                <div className="flex-1">
                  <label htmlFor="essential" className="block font-semibold text-stone-900 mb-1">
                    🔒 Απαραίτητα Cookies
                  </label>
                  <p className="text-stone-600 text-sm">
                    Απαραίτητα για τη λειτουργία της εφαρμογής. Κατάσταση σύνδεσης, 
                    ασφάλεια, γλώσσα.
                  </p>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-lg p-4 border border-stone-200 hover:bg-stone-50 transition-colors">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="analytics"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences({ ...preferences, analytics: e.target.checked })
                  }
                  className="h-5 w-5 mt-0.5 accent-emerald-700 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="analytics" className="block font-semibold text-stone-900 mb-1 cursor-pointer">
                    📊 Analytics (Ανάλυση)
                  </label>
                  <p className="text-stone-600 text-sm">
                    Μας βοηθά να καταλάβουμε πώς χρησιμοποιείτε την εφαρμογή 
                    και πού μπορούμε να βελτιωθούμε.
                  </p>
                </div>
              </div>
            </div>

            {/* Marketing */}
            <div className="bg-white rounded-lg p-4 border border-stone-200 hover:bg-stone-50 transition-colors">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences({ ...preferences, marketing: e.target.checked })
                  }
                  className="h-5 w-5 mt-0.5 accent-emerald-700 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="marketing" className="block font-semibold text-stone-900 mb-1 cursor-pointer">
                    📢 Marketing (Προωθητικό)
                  </label>
                  <p className="text-stone-600 text-sm">
                    Σχετικές ενημερώσεις για νέα προϊόντα και προσφορές που ενδιαφέρουν σας.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3 flex-wrap">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
            >
              💾 Αποθήκευση
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-lg border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 transition-colors inline-flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Επαναφορά
            </button>
          </div>
        </section>

        {/* Device Permissions Info */}
        <section className="bg-white rounded-lg border border-stone-200 p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4">📱 Δικαιώματα Συσκευής</h2>
          <p className="text-stone-600 text-sm mb-5">
            Αυτά τα δικαιώματα ζητούνται μόνο όταν τα χρειάζεται η εφαρμογή. 
            Κάθε ζήτηση περιλαμβάνει σαφή επεξήγηση του λόγου.
          </p>

          <div className="space-y-4">
            {/* Location */}
            <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-700 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-900 mb-1">📍 Τοποθεσία</h3>
                  <p className="text-stone-600 text-sm">
                    Χρησιμοποιείται για να σας δείξουμε τα κοντινότερα καταστήματα 
                    και να υπολογίσουμε τα έξοδα παράδοσης.
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-emerald-700 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-900 mb-1">🔔 Ειδοποιήσεις</h3>
                  <p className="text-stone-600 text-sm">
                    Σας ειδοποιούμε για αποδοχή αιτημάτων, νέα προϊόντα και ενημερώσεις παραγγελιών.
                  </p>
                </div>
              </div>
            </div>

            {/* Camera */}
            <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 text-emerald-700 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-900 mb-1">📷 Κάμερα</h3>
                  <p className="text-stone-600 text-sm">
                    Για video κλήσεις και λήψη φωτογραφιών προϊόντων 
                    (αν κάνετε κάποια αγορά).
                  </p>
                </div>
              </div>
            </div>

            {/* Microphone */}
            <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
              <div className="flex items-start gap-3">
                <Mic className="h-5 w-5 text-emerald-700 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-900 mb-1">🎤 Μικρόφωνο</h3>
                  <p className="text-stone-600 text-sm">
                    Για audio κλήσεις με αγρότες και ηχογράφηση ανατροφοδότησης.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Important Notes */}
        <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <h3 className="font-bold text-stone-900 mb-3">ℹ️ Σημαντικές Σημειώσεις</h3>
          <ul className="space-y-2 text-stone-700 text-sm">
            <li className="flex gap-2">
              <span>•</span>
              <span>Τα δικαιώματα συσκευής ζητούνται μόνο όταν τα χρειάζεται η εφαρμογή</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Μπορείτε ανά πάσα στιγμή να αλλάξετε τις ρυθμίσεις προστασίας του λειτουργικού σας</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Δεν πωλούμε ποτέ τα δεδομένα σας σε τρίτους</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Για περισσότερες πληροφορίες, δείτε τη 
                <Link href="/privacy" className="underline font-semibold"> Πολιτική Ιδιωτικότητας</Link>
              </span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
