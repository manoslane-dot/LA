'use client';

import { useEffect, useState } from 'react';
import { X, Settings } from 'lucide-react';

type ConsentPreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true, // πάντα αληθές
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    } else {
      const stored = JSON.parse(consent) as ConsentPreferences;
      setPreferences(stored);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsent: ConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem('cookieConsent', JSON.stringify(allConsent));
    setPreferences(allConsent);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const minimalConsent: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem('cookieConsent', JSON.stringify(minimalConsent));
    setPreferences(minimalConsent);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Consent Banner */}
      {!showPreferences && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-stone-200 shadow-lg p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900 mb-1">🍪 Προστασία Δεδομένων σας</h2>
                <p className="text-sm text-stone-600">
                  Χρησιμοποιούμε cookies και παρόμοιες τεχνολογίες για να βελτιώσουμε την εμπειρία σας, 
                  να αναλύσουμε τις επισκέψεις και να σας δείξουμε σχετικό περιεχόμενο. 
                  <strong> Μπορείτε να επιλέξετε τι δεδομένα μας αρέσει να μοιράζεστε.</strong>
                </p>
              </div>
              <button
                onClick={handleRejectAll}
                className="shrink-0 text-stone-400 hover:text-stone-600"
                aria-label="Κλείσιμο"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Button Group */}
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {/* Απόρριψη (ίδιο visual weight με αποδοχή) */}
              <button
                onClick={handleRejectAll}
                className="px-6 py-2.5 rounded-lg border-2 border-stone-300 bg-white text-stone-700 font-semibold hover:border-stone-400 hover:bg-stone-50 transition-colors text-sm"
              >
                ✋ Απόρριψη Όλων
              </button>

              {/* Ρυθμίσεις */}
              <button
                onClick={() => setShowPreferences(true)}
                className="px-6 py-2.5 rounded-lg border-2 border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold hover:border-emerald-300 hover:bg-emerald-100 transition-colors text-sm inline-flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Ρυθμίσεις
              </button>

              {/* Αποδοχή Όλων (όχι τεράστιο, ίδιο σε μέγεθος) */}
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2.5 rounded-lg border-2 border-emerald-600 bg-emerald-700 text-white font-semibold hover:bg-emerald-800 hover:border-emerald-700 transition-colors text-sm"
              >
                ✅ Αποδοχή Όλων
              </button>
            </div>

            {/* Πληροφορίες */}
            <p className="text-xs text-stone-500 mt-3">
              Μπορείτε ανά πάσα στιγμή να αλλάξετε τις ρυθμίσεις σας στο προφίλ σας.
            </p>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-stone-200 shadow-2xl p-4 sm:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-stone-900">Ρυθμίσεις Cookies</h2>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-stone-600 mb-5">
              Επιλέξτε ποια cookies θέλετε να δεχτείτε. Τα απαραίτητα cookies είναι πάντα ενεργά.
            </p>

            {/* Cookie Categories */}
            <div className="space-y-4 mb-5">
              {/* Essential (πάντα ενεργό) */}
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
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
                      🔒 Απαραίτητα Cookies (Πάντα Ενεργά)
                    </label>
                    <p className="text-sm text-stone-600">
                      Απαραίτητα για τη λειτουργία της εφαρμογής. Π.χ. κατάσταση σύνδεσης, 
                      ασφάλεια, προτιμήσεις γλώσσας.
                    </p>
                  </div>
                </div>
              </div>

              {/* Analytics (προαιρετικό) */}
              <div className="rounded-lg border border-stone-200 p-4 hover:bg-stone-50 transition-colors">
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
                    <p className="text-sm text-stone-600">
                      Βοηθά μας να κατανοήσουμε πώς χρησιμοποιείτε την εφαρμογή, 
                      ποιες σελίδες είναι δημοφιλείς και πού μπορούμε να βελτιωθούμε.
                    </p>
                  </div>
                </div>
              </div>

              {/* Marketing (προαιρετικό) */}
              <div className="rounded-lg border border-stone-200 p-4 hover:bg-stone-50 transition-colors">
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
                      📢 Marketing (Προωθητικό Περιεχόμενο)
                    </label>
                    <p className="text-sm text-stone-600">
                      Χρησιμοποιούμε αυτά τα δεδομένα για να σας δείξουμε σχετικές διαφημίσεις 
                      και ενημερώσεις για νέα προϊόντα.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleRejectAll}
                className="flex-1 px-4 py-2.5 rounded-lg border-2 border-stone-300 bg-white text-stone-700 font-semibold hover:bg-stone-50 transition-colors text-sm"
              >
                ✋ Ελάχιστα Δεδομένα
              </button>
              <button
                onClick={handleSavePreferences}
                className="flex-1 px-4 py-2.5 rounded-lg border-2 border-emerald-600 bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors text-sm"
              >
                💾 Αποθήκευση Ρυθμίσεων
              </button>
            </div>

            <p className="text-xs text-stone-500 mt-3">
              Μπορείτε να επιστρέψετε και να αλλάξετε αυτές τις ρυθμίσεις ανά πάσα στιγμή 
              από το προφίλ σας.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
