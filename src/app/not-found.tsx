"use client";

import Link from 'next/link';
import { Leaf, Home } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Η σελίδα δεν βρέθηκε | AgroDirect',
  description: 'Η σελίδα που ψάχνετε δεν βρέθηκε. Επιστρέψτε στην αρχική σελίδα του AgroDirect.',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-emerald-100 p-4 text-emerald-700">
            <Leaf className="h-8 w-8" />
          </div>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">404</p>
        <h1 className="mt-3 text-3xl font-bold text-stone-900">Η σελίδα δεν βρέθηκε</h1>
        <p className="mt-4 text-base leading-7 text-stone-600">
          Η διεύθυνση που ψάχνετε δεν υπάρχει ή μπορεί να έχει μετακινηθεί. Επιστρέψτε στην αρχική σελίδα για να συνεχίσετε.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-800">
            <Home className="h-4 w-4" />
            Πίσω στην αρχική
          </Link>
        </div>
      </div>
    </main>
  );
}
