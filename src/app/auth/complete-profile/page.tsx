'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Leaf, Phone, User, UserRoundCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  hasRequiredContactInfo,
  isPhoneValid,
  normalizeContactEmail,
  normalizePhone,
} from '@/lib/auth/contactInfo';
import { resolvePostLoginRedirect } from '@/lib/auth/roleRouting';

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+30');
  const [userRole, setUserRole] = useState<unknown>(null);

  const requestedRedirect = searchParams.get('redirectUrl');

  const nextUrl = useMemo(
    () =>
      resolvePostLoginRedirect({
        requestedRedirectUrl: requestedRedirect,
        userRole,
      }),
    [requestedRedirect, userRole],
  );
  const isFarmer = userRole === 'farmer';

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/auth');
        return;
      }

      const resolvedEmail =
        normalizeContactEmail(session.user.user_metadata?.contact_email) ??
        normalizeContactEmail(session.user.email) ??
        '';
      const resolvedName =
        typeof session.user.user_metadata?.full_name === 'string'
          ? session.user.user_metadata.full_name.trim()
          : '';
      const resolvedPhone = normalizePhone(session.user.user_metadata?.phone) ?? '+30';
      const resolvedNextUrl = resolvePostLoginRedirect({
        requestedRedirectUrl: requestedRedirect,
        userRole: session.user.user_metadata?.role,
      });

      setFullName(resolvedName);
      setEmail(resolvedEmail);
      setPhone(resolvedPhone);
      setUserRole(session.user.user_metadata?.role);

      if (hasRequiredContactInfo(session.user)) {
        router.replace(resolvedNextUrl);
        return;
      }

      setCheckingSession(false);
    };

    void loadUser();
  }, [requestedRedirect, router, supabase]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const normalizedEmail = normalizeContactEmail(email);
    const normalizedPhone = normalizePhone(phone);
    const trimmedName = fullName.trim();

    if (!normalizedEmail) {
      setErrorMsg('Συμπληρώστε έγκυρο email επικοινωνίας.');
      setLoading(false);
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMsg('Συμπληρώστε το ονοματεπώνυμό σας.');
      setLoading(false);
      return;
    }

    if (!isPhoneValid(normalizedPhone)) {
      setErrorMsg('Συμπληρώστε έγκυρο κινητό τηλέφωνο (π.χ. +30 69XXXXXXXX).');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
        contact_email: normalizedEmail,
        phone: normalizedPhone,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    router.replace(nextUrl);
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="auth-fade-in w-full max-w-sm rounded-2xl border border-emerald-100 bg-white/95 px-8 py-10 text-center shadow-[0_16px_50px_-28px_rgba(22,50,39,0.4)] backdrop-blur">
          <h2 className="text-lg font-bold text-emerald-950">Έλεγχος στοιχείων</h2>
          <p className="mt-1 text-sm text-slate-600">Φορτώνουμε τον λογαριασμό σας...</p>
          <div className="mt-5 flex justify-center" aria-hidden="true">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center px-4">
      <div className="absolute left-0 top-0 -z-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 -z-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />

      <div className="auth-fade-in w-full max-w-md rounded-2xl border border-emerald-100 bg-white/95 p-8 shadow-[0_16px_50px_-28px_rgba(22,50,39,0.4)] backdrop-blur">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Leaf className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-emerald-950">Ολοκλήρωση προφίλ</h1>
            <p className="mt-0.5 text-sm text-slate-600">Συμπληρώστε τα στοιχεία επικοινωνίας σας.</p>
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-600">
          Για να συνεχίσετε, χρειάζονται υποχρεωτικά τα στοιχεία επικοινωνίας σας.
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-700" />
              Ονοματεπώνυμο
            </span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="π.χ. Γιώργης Παπαδόπουλος"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2">
              <UserRoundCheck className="h-4 w-4 text-emerald-700" />
              Email επικοινωνίας
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="name@example.com"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-700" />
              Κινητό τηλέφωνο
            </span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(event) => {
                const nextValue = event.target.value.replace(/[^\d+]/g, '');
                setPhone(nextValue ? (nextValue.startsWith('+') ? nextValue : `+30${nextValue.replace(/^0+/, '')}`) : '+30');
              }}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="π.χ. +30 69XXXXXXXX"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Αποθήκευση...' : 'Συνέχεια'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CompleteProfileForm />
    </Suspense>
  );
}
