'use client';

import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link href="/" className="flex items-center gap-2 mb-4 w-fit">
            <Leaf className="h-6 w-6 text-emerald-700" />
            <span className="font-bold text-lg text-emerald-900">AgroDirect</span>
          </Link>
          <h1 className="text-3xl font-bold text-stone-900">Όροι Χρήσης</h1>
          <p className="text-stone-600 mt-2">Ενημερώθηκε στις: 27 Ιουλίου 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="prose prose-stone max-w-none space-y-8">
          {/* Intro */}
          <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-stone-700 m-0">
              Καλώς ήρθατε στο <strong>AgroDirect</strong>. Χρησιμοποιώντας την εφαρμογή μας, 
              συμφωνείτε με αυτούς τους όρους. Αν διαφωνείτε, παρακαλώ μην χρησιμοποιήσετε την υπηρεσία.
            </p>
          </section>

          {/* 1. Ο Λογαριασμός σας */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">1. Δημιουργία & Ευθύνη Λογαριασμού</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-stone-900 mb-2">Υπεύθυνος Λογαριασμού</h3>
                <p className="text-stone-700">
                  Είστε υπεύθυνος για την ασφάλεια του κωδικού πρόσβασής σας. 
                  Δεν ευθύνονται για απώλεια δεδομένων αν αποκαλυφθεί ο κωδικός σας.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-2">Ακρίβεια Πληροφοριών</h3>
                <p className="text-stone-700">
                  Υπισχνείστε ότι τα δεδομένα που παρέχετε είναι ακριβή και ενημερωμένα.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-2">Μια Λογαριασμό Ανά Χρήστη</h3>
                <p className="text-stone-700">
                  Δεν επιτρέπονται πολλαπλοί λογαριασμοί ή λογαριασμοί ψευδούς ταυτότητας.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Χρησιμοποίηση της Υπηρεσίας */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">2. Αποδεκτή Χρησιμοποίηση</h2>
            <p className="text-stone-700 mb-3">
              Συμφωνείτε ότι <strong>δεν θα</strong>:
            </p>
            <ul className="space-y-2 text-stone-700">
              <li className="flex gap-3">
                <span className="text-red-600 font-bold">✗</span>
                <span>Δημιουργήσετε ψευδή δεδομένα ή λογαριασμούς</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 font-bold">✗</span>
                <span>Χρησιμοποιήσετε τα δεδομένα άλλων χωρίς άδεια</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 font-bold">✗</span>
                <span>Αποστείλετε ενοχλητικά μηνύματα ή να ενοχλήσετε άλλους χρήστες</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 font-bold">✗</span>
                <span>Επιχειρήσετε να παραβιάσετε την ασφάλεια της εφαρμογής</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 font-bold">✗</span>
                <span>Κάνετε automated scraping ή bot attacks</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 font-bold">✗</span>
                <span>Δημοσιεύσετε παράνομο περιεχόμενο</span>
              </li>
            </ul>
          </section>

          {/* 3. Πωλήσεις & Αγορές */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">3. Πωλήσεις & Αγορές Προϊόντων</h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-2">🌾 Αγρότες/Πωλητές</h3>
                <ul className="text-stone-700 space-y-1 ml-4 list-disc">
                  <li>Υπεύθυνοι για την ποιότητα και την ακρίβεια των προϊόντων τους</li>
                  <li>Δεν επιτρέπεται η πώληση παράνομων ή επικίνδυνων αγαθών</li>
                  <li>Πρέπει να τηρούν τις κανόνες υγιεινής και ασφάλειας τροφίμων</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-2">🛍️ Αγοραστές</h3>
                <ul className="text-stone-700 space-y-1 ml-4 list-disc">
                  <li>Υπεύθυνοι για την ακρίβεια των αιτημάτων τους</li>
                  <li>Δεν επιτρέπονται απάτες ή ψευδή αιτήματα</li>
                  <li>Πρέπει να επικοινωνούν σε καλή πίστη με τους παραγωγούς</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Δικαιώματα Πνευματικής Ιδιοκτησίας */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">4. Πνευματική Ιδιοκτησία</h2>
            <p className="text-stone-700 mb-3">
              <strong>AgroDirect</strong> κατέχει τα δικαιώματα στο λογισμικό, το σχεδιασμό και τα περιεχόμενα.
            </p>
            <div className="bg-white p-4 rounded-lg border border-stone-200 space-y-2 text-stone-700">
              <p>• Δεν επιτρέπεται η αντιγραφή, τροποποίηση ή διανομή χωρίς άδεια</p>
              <p>• Τα περιεχόμενα που δημοσιεύετε (εικόνες, κείμενο) παραμένουν ιδιοκτησία σας</p>
              <p>• Αποδεχόμαστε άδεια να χρησιμοποιήσουμε το περιεχόμενό σας για να λειτουργήσει η πλατφόρμα</p>
            </div>
          </section>

          {/* 5. Αποποίηση Ευθύνης */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">5. Απαίρεση Ευθύνης</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2 text-stone-700">
              <p>
                <strong>⚠️ Σημαντικό:</strong> Η υπηρεσία παρέχεται "όπως είναι". 
                Δεν εγγυόμαστε την απουσία σφαλμάτων ή ότι η εφαρμογή θα λειτουργεί χωρίς διακοπές.
              </p>
              <p>
                Δεν ευθύνονται για ζημίες που προκύπτουν από:
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Απώλεια δεδομένων ή δυσλειτουργία της εφαρμογής</li>
                <li>Διαφορές ή διαφωνίες μεταξύ χρηστών</li>
                <li>Αποτυχία παράδοσης ή ποιότητας προϊόντων (μεταξύ αγοραστή-πωλητή)</li>
              </ul>
            </div>
          </section>

          {/* 6. Τροποποίηση/Ακύρωση Λογαριασμού */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">6. Ακύρωση Λογαριασμού</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-stone-900 mb-2">Ακύρωση από εσάς</h3>
                <p className="text-stone-700">
                  Μπορείτε να διαγράψετε τον λογαριασμό σας ανά πάσα στιγμή από τις ρυθμίσεις προφίλ.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-2">Ακύρωση από εμάς</h3>
                <p className="text-stone-700">
                  Δικαίωμα να ακυρώσουμε τον λογαριασμό σας εάν παραβιάσετε αυτούς τους όρους 
                  ή εάν υπάρξει μη νόμιμη δραστηριότητα.
                </p>
              </div>
            </div>
          </section>

          {/* 7. Αλλαγές στους Όρους */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">7. Αλλαγές στους Όρους</h2>
            <p className="text-stone-700">
              Δικαίωμα να τροποποιήσουμε αυτούς τους όρους ανά πάσα στιγμή. 
              Θα ειδοποιήσουμε τους ενεργούς χρήστες για σημαντικές αλλαγές μέσω email.
            </p>
          </section>

          {/* 8. Επικοινωνία & Διευθέτηση */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">8. Επικοινωνία & Διευθέτηση</h2>
            <p className="text-stone-700 mb-3">
              Για παράπονα ή διαφορές:
            </p>
            <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
              <p className="text-stone-900 font-semibold">📧 Email: support@agrodirect.gr</p>
              <p className="text-stone-700 text-sm">
                Θα προσπαθήσουμε να διευθετήσουμε τα προβλήματα σας εντός 14 ημερών.
              </p>
            </div>
          </section>

          {/* 9. Νόμιμη Εφαρμογή */}
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">9. Νόμιμη Εφαρμογή</h2>
            <p className="text-stone-700">
              Αυτοί οι όροι διέπονται από το ελληνικό δίκαιο και τη νομοθεσία της Ευρωπαϊκής Ένωσης (GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">10. Περιεχόμενο & Εικόνες</h2>
            <div className="bg-white border border-stone-200 rounded-lg p-4">
              <p className="text-stone-700 leading-relaxed">
                Οι χρήστες δεσμεύονται να μην ανεβάζουν παράνομο, προσβλητικό ή μη αποδεκτό περιεχόμενο. Οι εικόνες που αποστέλλονται ελέγχονται αυτόματα για την προστασία της πλατφόρμας και των υπόλοιπων χρηστών.
              </p>
            </div>
          </section>

          {/* Links */}
          <section className="pt-4 border-t border-stone-200">
            <h3 className="font-semibold text-stone-900 mb-3">Σχετικές σελίδες:</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-emerald-700 hover:underline font-semibold">
                  → Πολιτική Ιδιωτικότητας
                </Link>
              </li>
              <li>
                <Link href="/" className="text-emerald-700 hover:underline font-semibold">
                  ← Επιστροφή στην Αρχική Σελίδα
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
