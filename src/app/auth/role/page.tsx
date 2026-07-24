import Link from 'next/link';
import { Leaf, ShoppingBag, Tractor } from 'lucide-react';

export default function RoleSelectionPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Επιλογή ρόλου</h1>
          <p className="mt-2 text-sm text-gray-600">Πώς θέλετε να συνεχίσετε σήμερα;</p>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/auth?redirectUrl=/consumer/dashboard"
            className="flex w-full items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition hover:bg-emerald-100"
          >
            <span className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-emerald-700" />
              <span className="font-semibold text-emerald-900">Είμαι Καταναλωτής</span>
            </span>
            <span className="text-xs text-emerald-700">Συνέχεια</span>
          </Link>

          <Link
            href="/auth?redirectUrl=/farmer/dashboard"
            className="flex w-full items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left transition hover:bg-amber-100"
          >
            <span className="flex items-center gap-3">
              <Tractor className="h-5 w-5 text-amber-700" />
              <span className="font-semibold text-amber-900">Είμαι Παραγωγός / Αγρότης</span>
            </span>
            <span className="text-xs text-amber-700">Συνέχεια</span>
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 transition hover:text-gray-700">
            Επιστροφή στην αρχική σελίδα
          </Link>
        </div>
      </div>
    </main>
  );
}
