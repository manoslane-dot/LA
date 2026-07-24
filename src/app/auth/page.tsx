'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { saveLoginPreference } from '@/lib/auth/sessionPersistence';
import { resolvePostLoginRedirect, resolveRoleFromIntent } from '@/lib/auth/roleRouting';
import { buildCompleteProfileRedirect, hasRequiredContactInfo } from '@/lib/auth/contactInfo';
import Link from 'next/link';
import GoogleSignInButton from './GoogleSignInButton';

const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'proton.me', 'hotmail.com'];

function validateEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return allowedDomains.includes(domain);
}

// Μετονομάσαμε το component σε AuthForm για να το τυλίξουμε σε Suspense.
// Αυτό είναι απαραίτητο επειδή χρησιμοποιεί το useSearchParams.
function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingSession, setCheckingSession] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const supabase = createClient();

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white px-8 py-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
            <span className="text-lg font-bold">A</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">AgroApp</h2>
          <p className="mt-1 text-sm text-gray-500">Έλεγχος σύνδεσης...</p>
          <div className="mt-5 flex justify-center" aria-hidden="true">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
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
      if (!validateEmailDomain(email)) {
        setErrorMsg('Παρακαλώ χρησιμοποιήστε ένα έγκυρο email (π.χ. Gmail, Outlook, Yahoo, iCloud, Proton).');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
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
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">AgroApp</h1>
          <h2 className="text-xl font-semibold text-gray-800 mt-2">
            {isLogin ? 'Σύνδεση στον λογαριασμό σας' : 'Δημιουργία νέου λογαριασμού'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isLogin ? 'Εισάγετε τα στοιχεία σας για πρόσβαση' : 'Εγγραφείτε για να αγοράσετε ή να πουλήσετε προϊόντα'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Κωδικός πρόσβασης</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            {loading ? 'Επεξεργασία...' : isLogin ? 'Σύνδεση' : 'Εγγραφή'}
          </button>

          {isLogin && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              Να με θυμάσαι
            </label>
          )}

          {isLogin && showForgotPassword && (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="w-full text-sm text-green-700 hover:underline font-medium text-left"
            >
              Ξέχασα τον κωδικό μου
            </button>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">ή</span>
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
            className="text-sm text-green-600 hover:underline font-medium"
          >
            {isLogin ? 'Δεν έχετε λογαριασμό; Εγγραφείτε' : 'Έχετε ήδη λογαριασμό; Συνδεθείτε'}
          </button>
        </div>

        <div className="mt-6 border-t pt-4 text-center">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← Επιστροφή στην αρχική σελίδα
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function AuthPage() {
  // Το Suspense boundary είναι απαραίτητο για τη χρήση του useSearchParams() σε μια σελίδα
  // που γίνεται pre-render. Επιτρέπει στο Next.js να αποδώσει ένα fallback στον server
  // και να φορτώσει το δυναμικό component (AuthForm) στον client.
  return (
    // Χρησιμοποιούμε ένα απλό div για fallback για να αποφύγουμε το τρεμόπαιγμα του περιεχομένου.
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}><AuthForm /></Suspense>
  );
}
