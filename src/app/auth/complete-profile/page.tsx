'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
      const resolvedPhone = normalizePhone(session.user.user_metadata?.phone) ?? '';
      const resolvedNextUrl = resolvePostLoginRedirect({
        requestedRedirectUrl: requestedRedirect,
        userRole: session.user.user_metadata?.role,
      });

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

    if (!normalizedEmail) {
      setErrorMsg('Συμπληρώστε έγκυρο email επικοινωνίας.');
      setLoading(false);
      return;
    }

    if (!isPhoneValid(normalizedPhone)) {
      setErrorMsg('Συμπληρώστε έγκυρο κινητό τηλέφωνο (7-20 χαρακτήρες).');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white px-8 py-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Έλεγχος στοιχείων</h2>
          <p className="mt-1 text-sm text-gray-500">Φορτώνουμε τον λογαριασμό σας...</p>
          <div className="mt-5 flex justify-center" aria-hidden="true">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-green-700">Ολοκλήρωση προφίλ</h1>
        <p className="mt-2 text-sm text-gray-600">
          Για να συνεχίσετε, χρειάζονται υποχρεωτικά τα στοιχεία επικοινωνίας σας.
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Email επικοινωνίας
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="name@example.com"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Κινητό τηλέφωνο
            <input
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="π.χ. 69XXXXXXXX"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
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
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <CompleteProfileForm />
    </Suspense>
  );
}
