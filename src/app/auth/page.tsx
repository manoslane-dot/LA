'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '~/lib/supabase';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (isLogin) {
      // Σύνδεση
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        // Αν συνδεθεί επιτυχώς, τον πηγαίνουμε στο dashboard του αγρότη/πωλητή
        router.push('/farmer/dashboard');
      }
    } else {
      // Εγγραφή
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
