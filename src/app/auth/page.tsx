'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { saveLoginPreference } from '@/lib/auth/sessionPersistence';
import { resolvePostLoginRedirect, resolveRoleFromIntent } from '@/lib/auth/roleRouting';
import { buildCompleteProfileRedirect, hasRequiredContactInfo } from '@/lib/auth/contactInfo';
import { SERVICE_AREA_OPTIONS } from '@/lib/serviceAreas';
import Link from 'next/link';
import GoogleSignInButton from './GoogleSignInButton';

const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'proton.me', 'hotmail.com'];

function validateEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return allowedDomains.includes(domain);
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingSession, setCheckingSession] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const supabase = createClient();
  const intendedRole = resolveRoleFromIntent(
    searchParams.get('role'),
    searchParams.get('redirectUrl'),
  );
  const isFarmerFlow = intendedRole === 'farmer';

  const toggleServiceArea = (value: string) => {
    setServiceAreas((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  useEffect(() => {
    const redirectIfLoggedIn = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        let resolvedUser = session.user;
        const intendedRole = resolveRoleFromIntent(
          searchParams.get('role'),
          searchParams.get('redirectUrl'),
        );

        let resolvedRole = session.user.user_metadata?.role;
        if (intendedRole && resolvedRole !== intendedRole) {
          const { data: updateData, error: roleUpdateError } = await supabase.auth.updateUser({
            data: { role: intendedRole },
          });

          if (roleUpdateError) {
            console.error('Σφάλμα αλλαγής ρόλου:', roleUpdateError.message);
          } else {
            resolvedUser = updateData.user ?? resolvedUser;
            resolvedRole = updateData.user?.user_metadata?.role;
            // Refresh session to update JWT token
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('Σφάλμα ανανέωσης session:', refreshError.message);
            }
          }
        }

        if (!hasRequiredContactInfo(resolvedUser)) {
          router.replace(buildCompleteProfileRedirect(searchParams.get('redirectUrl')));
          return;
        }

        const nextUrl = resolvePostLoginRedirect({
          requestedRedirectUrl: searchParams.get('redirectUrl'),
          userRole: resolvedRole,
        });
        router.replace(nextUrl);
        return;
      }

      setCheckingSession(false);
    };

    void redirectIfLoggedIn();
  }, [router, searchParams, supabase]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="auth-fade-in w-full max-w-sm rounded-2xl border border-emerald-100 bg-white/95 px-8 py-10 text-center shadow-[0_16px_50px_-28px_rgba(22,50,39,0.4)] backdrop-blur">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Leaf className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-emerald-950">AgroDirect</h2>
          <p className="mt-1 text-sm text-emerald-800/70">Έλεγχος σύνδεσης...</p>
          <div className="mt-5 flex justify-center" aria-hidden="true">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setShowForgotPassword(false);

    if (isLogin) {
      // Σύνδεση
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setShowForgotPassword(true);
      } else {
        let resolvedUser = data.user;
        const intendedRole = resolveRoleFromIntent(
          searchParams.get('role'),
          searchParams.get('redirectUrl'),
        );

        if (intendedRole) {
          const { data: updateData, error: roleUpdateError } = await supabase.auth.updateUser({
            data: { role: intendedRole },
          });

          if (roleUpdateError) {
            console.error('Σφάλμα ενημέρωσης ρόλου:', roleUpdateError.message);
          } else {
            resolvedUser = updateData.user ?? resolvedUser;
            // Refresh session to update JWT token
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('Σφάλμα ανανέωσης session:', refreshError.message);
            }
          }
        }

        saveLoginPreference(rememberMe);
        const requestedRedirect = searchParams.get('redirectUrl');
        const nextUrl = resolvePostLoginRedirect({
          requestedRedirectUrl: requestedRedirect,
          userRole: intendedRole ?? resolvedUser?.user_metadata?.role,
        });

        if (!hasRequiredContactInfo(resolvedUser ?? {})) {
          router.push(buildCompleteProfileRedirect(nextUrl));
          setLoading(false);
          return;
        }

        router.push(nextUrl);
      }
    } else {
      // Εγγραφή
      const trimmedName = fullName.trim();
      if (!validateEmailDomain(email)) {
        setErrorMsg('Παρακαλώ χρησιμοποιήστε ένα έγκυρο email (π.χ. Gmail, Outlook, Yahoo, iCloud, Proton).');
        setLoading(false);
        return;
      }

      if (trimmedName.length < 2) {
        setErrorMsg('Συμπληρώστε το ονοματεπώνυμό σας.');
        setLoading(false);
        return;
      }

      if (isFarmerFlow && serviceAreas.length === 0) {
        setErrorMsg('Επιλέξτε τουλάχιστον μία περιοχή εξυπηρέτησης (ΤΚ / Πόλη).');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: intendedRole ?? 'consumer',
            full_name: trimmedName,
            contact_email: email.trim().toLowerCase(),
            service_areas: isFarmerFlow ? serviceAreas : [],
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Η εγγραφή ολοκληρώθηκε! Παρακαλώ ελέγξτε το email σας για τον σύνδεσμο επιβεβαίωσης.');
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Συμπλήρωσε πρώτα το email σου για να στείλουμε email αλλαγής κωδικού.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Στάλθηκε email επαναφοράς κωδικού. Έλεγξε το inbox σου.');
    }

    setLoading(false);
  };

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute -left-16 -top-20 h-60 w-60 rounded-full bg-amber-300/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-16 -right-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />

      <div className="auth-fade-in relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-emerald-100/80 bg-white/90 shadow-[0_24px_70px_-35px_rgba(22,50,39,0.45)] backdrop-blur lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
              <Sparkles className="h-3.5 w-3.5" />
              Αγροτική Αγορά
            </p>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight">
              Καλώς ήρθες στο AgroDirect
            </h2>
            <p className="mt-4 text-sm leading-7 text-emerald-100/90">
              Ένα καθαρό και ασφαλές περιβάλλον για να συνδέεις παραγωγούς και καταναλωτές με διαφάνεια.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              'Ασφαλής πρόσβαση με email ή Google',
              'Γρήγορη είσοδος με διατήρηση συνεδρίας',
              'Ροή προσαρμοσμένη στον ρόλο σας',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-emerald-50/95">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8 text-center lg:text-left">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 lg:mx-0">
              <Leaf className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">AgroDirect</h1>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {isLogin ? 'Σύνδεση στον λογαριασμό σας' : 'Δημιουργία νέου λογαριασμού'}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              {isLogin ? 'Συνδεθείτε για πρόσβαση στην πλατφόρμα σας.' : 'Εγγραφείτε για να αγοράσετε ή να διαθέσετε προϊόντα.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ονοματεπώνυμο</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="π.χ. Γιάννης Παπαδόπουλος"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Κωδικός πρόσβασης</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && isFarmerFlow && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                <p className="text-sm font-semibold text-amber-900">Περιοχές εξυπηρέτησης (ΤΚ / Πόλη)</p>
                <p className="mt-1 text-xs leading-5 text-amber-800/90">
                  Επίλεξε μία ή περισσότερες περιοχές για να βλέπει άμεσα ο καταναλωτής αν τον εξυπηρετείς.
                </p>
                <div className="mt-3 grid max-h-44 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {SERVICE_AREA_OPTIONS.map((option) => {
                    const checked = serviceAreas.includes(option.label);
                    return (
                      <label
                        key={option.label}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleServiceArea(option.label)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-amber-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Επεξεργασία...' : isLogin ? 'Σύνδεση' : 'Εγγραφή'}
            </button>

            {isLogin && (
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Να με θυμάσαι
              </label>
            )}

            {isLogin && showForgotPassword && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full text-left text-sm font-medium text-emerald-800 transition hover:text-emerald-900 hover:underline"
              >
                Ξέχασα τον κωδικό μου
              </button>
            )}

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-[0.2em]">
                <span className="bg-white px-3 text-slate-400">ή</span>
              </div>
            </div>

            <GoogleSignInButton
              redirectUrl={searchParams.get('redirectUrl') ?? '/consumer/dashboard'}
              rememberMe={rememberMe}
              role={searchParams.get('role') ?? undefined}
            />
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline"
            >
              {isLogin ? 'Δεν έχετε λογαριασμό; Εγγραφείτε' : 'Έχετε ήδη λογαριασμό; Συνδεθείτε'}
            </button>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center">
            <Link href="/" className="text-xs font-medium text-slate-500 transition hover:text-slate-700">
              ← Επιστροφή στην αρχική σελίδα
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AuthForm />
    </Suspense>
  );
}
