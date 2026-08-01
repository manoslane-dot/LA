'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Leaf } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { validateStrongPassword } from '@/lib/auth/credentialsPolicy';

const getFriendlyResetPasswordError = (message?: string) => {
  const normalized = message?.toLowerCase() ?? '';

  if (normalized.includes('sub claim') || normalized.includes('jwt') || normalized.includes('token')) {
    return 'Ο σύνδεσμος επαναφοράς δεν είναι πλέον έγκυρος. Ζητήστε νέο email επαναφοράς.';
  }

  return message ?? 'Αποτυχία αλλαγής κωδικού.';
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initializeRecovery = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          setErrorMsg(getFriendlyResetPasswordError(error.message));
          setReady(true);
          return;
        }

        if (session) {
          setReady(true);
          return;
        }

        const hash = window.location.hash.replace('#', '');
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (accessToken && refreshToken && type === 'recovery') {
          const { error: exchangeError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (exchangeError) {
            setErrorMsg(getFriendlyResetPasswordError(exchangeError.message));
          }
        } else {
          setErrorMsg('Το link επαναφοράς δεν είναι ακόμη έγκυρο. Ζητήστε νέο email επαναφοράς.');
        }

        setReady(true);
      } catch (err: any) {
        setErrorMsg(getFriendlyResetPasswordError(err?.message));
        setReady(true);
      }
    };

    void initializeRecovery();
  }, [supabase]);

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    const passwordError = validateStrongPassword(password);
    if (passwordError) {
      setErrorMsg(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Οι κωδικοί δεν ταιριάζουν.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(getFriendlyResetPasswordError(error.message));
    } else {
      setSuccessMsg('Ο κωδικός άλλαξε επιτυχώς. Μπορείς να συνδεθείς τώρα.');
      setTimeout(() => router.replace('/auth'), 1500);
    }

    setLoading(false);
  };

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
            <h1 className="text-2xl font-extrabold tracking-tight text-emerald-950">Επαναφορά κωδικού</h1>
            <p className="mt-0.5 text-sm text-slate-600">Ορίστε έναν νέο, ασφαλή κωδικό πρόσβασης.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Νέος κωδικός</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={!ready}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-slate-500">
              8-12 χαρακτήρες με κεφαλαία, πεζά, αριθμούς και ειδικούς χαρακτήρες (π.χ. ! @ # $ %).
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Επιβεβαίωση κωδικού</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={!ready}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !ready}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <KeyRound className="h-4 w-4" />
            {loading ? 'Επεξεργασία...' : 'Αλλαγή κωδικού'}
          </button>
        </form>
      </div>
    </div>
  );
}
