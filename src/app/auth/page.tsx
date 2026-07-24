'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import GoogleSignInButton from './GoogleSignInButton';

const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'proton.me', 'hotmail.com'];

function validateEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return allowedDomains.includes(domain);
}

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setShowForgotPassword(false);

    if (isLogin) {
      // Σύνδεση
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setShowForgotPassword(true);
      } else {
        // Αν συνδεθεί επιτυχώς, τον πηγαίνουμε στο dashboard του αγρότη/πωλητή
        router.push('/farmer/dashboard');
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
        alert('Η εγγραφή ολοκληρώθηκε! Παρακαλώ συνδεθείτε.');
        setIsLogin(true);
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
            {isLogin ? 'Εισάγετε τα στοιχεία σας για πρόσβαση' : 'Εγγραφείτε για να διαχειριστείτε τις καλλιέργειές σας'}
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

          <GoogleSignInButton />
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
            href="/consumer/dashboard"
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← Επιστροφή στην αγορά καταναλωτή
          </Link>
        </div>

      </div>
    </div>
  );
}
