'use client';

import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link href="/" className="flex items-center gap-2 mb-4 w-fit">
            <Leaf className="h-6 w-6 text-emerald-700" />
            <span className="font-bold text-lg text-emerald-900">AgroDirect</span>
          </Link>
          <h1 className="text-3xl font-bold text-stone-900">Πολιτική Ιδιωτικότητας</h1>
          <p className="text-stone-600 mt-2">Ενημερώθηκε στις: 27 Ιουλίου 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="prose prose-stone max-w-none space-y-8">
          {/* 1. Εισαγωγή */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">1. Ποιοι Είμαστε</h2>
            <p className="text-stone-700 leading-relaxed">
              Το <strong>AgroDirect</strong> είναι μια πλατφόρμα που συνδέει τοπικούς παραγωγούς με καταναλωτές. 
              Δεσμευόμαστε να προστατεύσουμε τα δεδομένα και την ιδιωτικότητά σας με ίσιες και διαφανείς πρακτικές.
            </p>
          </section>

          {/* 2. Τι Δεδομένα Συλλέγουμε */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">2. Τι Δεδομένα Συλλέγουμε</h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-2">📋 Δεδομένα Λογαριασμού</h3>
                <ul className="text-stone-700 space-y-1 ml-4 list-disc">
                  <li>Όνομα, email, κινητό τηλέφωνο</li>
                  <li>Πληροφορίες δημοσιοποίησης (για αγρότες)</li>
                  <li>Περιοχές εξυπηρέτησης που επιλέγετε</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-2">🛍️ Δεδομένα Συναλλαγών</h3>
                <ul className="text-stone-700 space-y-1 ml-4 list-disc">
                  <li>Αιτήματα αγορών που στέλνετε</li>
                  <li>Ποσότητες και τιμές</li>
                  <li>Μηνύματα ανάμεσα σε αγοραστές και πωλητές</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-2">🍪 Cookies & Τεχνολογίες</h3>
                <ul className="text-stone-700 space-y-1 ml-4 list-disc">
                  <li><strong>Απαραίτητα:</strong> Κατάσταση σύνδεσης, προτιμήσεις</li>
                  <li><strong>Analytics:</strong> Πώς χρησιμοποιείτε την εφαρμογή</li>
                  <li><strong>Marketing:</strong> Σχετικές ενημερώσεις και διαφημίσεις (αν συμφωνείτε)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Γιατί Συλλέγουμε Δεδομένα */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">3. Γιατί Συλλέγουμε Δεδομένα</h2>
            <ul className="space-y-3 text-stone-700">
              <li className="flex gap-3">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Λειτουργία:</strong> Για να σας αφήσουμε να δημιουργήσετε λογαριασμό και να κάνετε αγορές</span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Επικοινωνία:</strong> Για να σας ενημερώσουμε για αιτήματα και αποδοχές</span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Βελτίωση:</strong> Για να καταλάβουμε πώς χρησιμοποιείτε την εφαρμογή</span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Νομική Συμμόρφωση:</strong> Για να τηρούμε τους κανόνες ασφαλείας</span>
              </li>
            </ul>
          </section>

          {/* 4. Χρησιμοποίηση Δεδομένων */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">4. Ποιος Έχει Πρόσβαση στα Δεδομένα σας</h2>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-stone-700 mb-3">
                <strong>📍 Κανόνας:</strong> Τα δεδομένα σας δεν πωλούνται, δεν χρησιμοποιούνται για μαζικές ενημερώσεις, 
                και δεν μοιράζονται με τρίτους χωρίς την άδειά σας.
              </p>
              <ul className="space-y-2 text-stone-700">
                <li className="flex gap-2">
                  <span>•</span>
                  <span><strong>Στο αίτημα αγοράς:</strong> Ο παραγωγός βλέπει το email/κινητό σας (μόνο αν επιβεβαιώσει το αίτημα)</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span><strong>Analytics:</strong> Μόνο για ανάλυση ροής, όχι ατομικά</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span><strong>Νομικές απαιτήσεις:</strong> Μπορεί να αποκαλύψουμε αν υπάρχει νόμιμη απαίτηση</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 5. Δικαιώματα σας */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">5. Τα Δικαιώματά σας (GDPR)</h2>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-1">Δικαίωμα Πρόσβασης</h3>
                <p className="text-stone-600 text-sm">Μπορείτε να ζητήσετε αντίγραφο όλων των δεδομένων που έχουμε γι'αυτούς.</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-1">Δικαίωμα Διόρθωσης</h3>
                <p className="text-stone-600 text-sm">Μπορείτε να ενημερώσετε ή να διορθώσετε τα δεδομένα σας άμεσα από το προφίλ σας.</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-1">Δικαίωμα Διαγραφής</h3>
                <p className="text-stone-600 text-sm">Μπορείτε να ζητήσετε τη διαγραφή του λογαριασμού σας και όλων των δεδομένων (όπου επιτρέπεται νόμιμα).</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-1">Δικαίωμα Περιορισμού</h3>
                <p className="text-stone-600 text-sm">Μπορείτε να διαφωνήσετε με την επεξεργασία δεδομένων για marketing ή analytics.</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-1">Δικαίωμα Εξαγωγής</h3>
                <p className="text-stone-600 text-sm">Μπορείτε να λάβετε τα δεδομένα σας σε δομημένη μορφή (JSON/CSV).</p>
              </div>
            </div>
          </section>

          {/* 6. Ασφάλεια */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">6. Ασφάλεια Δεδομένων</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              Χρησιμοποιούμε κρυπτογράφηση (HTTPS) και ασφαλείς πρακτικές για να προστατεύσουμε τα δεδομένα σας.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-stone-700">
                <strong>⚠️ Σημείωση:</strong> Καμία μέθοδος μετάδοσης στο διαδίκτυο δεν είναι 100% ασφαλής. 
                Χρησιμοποιούμε βιομηχανικές πρακτικές, αλλά δεν μπορούμε να εγγυηθούμε απόλυτη ασφάλεια.
              </p>
            </div>
          </section>

          {/* 7. Επικοινωνία */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">7. Επικοινωνία</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              Αν έχετε ερωτήσεις ή ζητήματα σχετικά με τη μεταχείριση των δεδομένων σας:
            </p>
            <div className="bg-white border border-stone-200 rounded-lg p-4">
              <p className="text-stone-900 font-semibold">Email: support@agrodirect.gr</p>
              <p className="text-stone-600 text-sm mt-2">Θα απαντήσουμε σε όλα τα αιτήματα εντός 30 ημερών.</p>
            </div>
          </section>

          {/* 8. Αλλαγές */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">8. Αλλαγές σε Αυτή την Πολιτική</h2>
            <p className="text-stone-700 leading-relaxed">
              Μπορεί να ενημερώσουμε αυτή την πολιτική ανά πάσα στιγμή. Αν υπάρχουν σημαντικές αλλαγές, 
              θα σας ειδοποιήσουμε μέσω email ή ειδοποίησης στην εφαρμογή.
            </p>
          </section>
        </div>

        {/* Back Button */}
        <div className="mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
          >
            ← Πίσω
          </Link>
        </div>
      </main>
    </div>
  );
}
