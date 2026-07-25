import Link from 'next/link';
import { Leaf, ShoppingBag, Tractor } from 'lucide-react';

export default function RoleSelectionPage() {
  return (
    <main className="relative isolate min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute left-0 top-0 -z-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 -z-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />

      <div className="auth-fade-in mx-auto w-full max-w-xl rounded-3xl border border-emerald-100/80 bg-white/92 p-8 shadow-[0_24px_70px_-35px_rgba(22,50,39,0.45)] backdrop-blur">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">Επιλογή ρόλου</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Πώς θέλετε να συνεχίσετε σήμερα;</p>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/auth?role=consumer&redirectUrl=/consumer/dashboard"
            className="group flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:bg-emerald-100"
          >
            <span className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-emerald-700" />
              <span className="font-semibold text-emerald-900">Είμαι Καταναλωτής</span>
            </span>
            <span className="text-xs font-semibold text-emerald-700 transition group-hover:translate-x-0.5">Συνέχεια</span>
          </Link>

          <Link
            href="/auth?role=farmer&redirectUrl=/farmer/dashboard"
            className="group flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:bg-amber-100"
          >
            <span className="flex items-center gap-3">
              <Tractor className="h-5 w-5 text-amber-700" />
              <span className="font-semibold text-amber-900">Είμαι Παραγωγός / Αγρότης</span>
            </span>
            <span className="text-xs font-semibold text-amber-700 transition group-hover:translate-x-0.5">Συνέχεια</span>
          </Link>
        </div>

        <div className="mt-7 text-center">
          <Link href="/" className="text-sm font-medium text-slate-500 transition hover:text-slate-700">
            Επιστροφή στην αρχική σελίδα
          </Link>
        </div>
      </div>
    </main>
  );
}
