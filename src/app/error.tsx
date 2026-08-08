"use client";

import Link from 'next/link';
import { Leaf, RefreshCw, Home } from 'lucide-react';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-rose-100 p-4 text-rose-700">
            <Leaf className="h-8 w-8" />
          </div>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">500</p>
        <h1 className="mt-3 text-3xl font-bold text-stone-900">Κάτι πήγε στραβά</h1>
        <p className="mt-4 text-base leading-7 text-stone-600">
          Προέκυψε ένα μη αναμενόμενο σφάλμα. Μπορείτε να δοκιμάσετε ξανά ή να επιστρέψετε στην αρχική σελίδα.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-800"
          >
            <RefreshCw className="h-4 w-4" />
            Δοκιμάστε ξανά
          </button>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 font-semibold text-stone-700 transition hover:bg-stone-50">
            <Home className="h-4 w-4" />
            Αρχική σελίδα
          </Link>
        </div>
      </div>
    </main>
  );
}
