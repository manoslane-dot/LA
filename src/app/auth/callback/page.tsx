'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resolvePostLoginRedirect, resolveRoleFromIntent } from '@/lib/auth/roleRouting';
import { saveLoginPreference } from '@/lib/auth/sessionPersistence';
import { buildCompleteProfileRedirect, hasRequiredContactInfo } from '@/lib/auth/contactInfo';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const finalizeAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error', error);
        router.replace('/auth');
        return;
      }

      if (session) {
        const redirectUrl = searchParams.get('redirectUrl');
        const intendedRole = resolveRoleFromIntent(searchParams.get('role'), redirectUrl);
        let resolvedRole = session.user.user_metadata?.role;
        let resolvedUser = session.user;

        if (intendedRole && resolvedRole !== intendedRole) {
          const { data: updateData, error: updateError } = await supabase.auth.updateUser({
            data: { role: intendedRole },
          });

          if (updateError) {
            console.error('Auth callback role update error', updateError);
          } else {
            resolvedUser = updateData.user ?? resolvedUser;
            resolvedRole = updateData.user?.user_metadata?.role;
          }
        }

        const remember = searchParams.get('remember') !== '0';
        const safeRedirectUrl = resolvePostLoginRedirect({
          requestedRedirectUrl: redirectUrl,
          userRole: resolvedRole ?? intendedRole,
        });

        if (!hasRequiredContactInfo(resolvedUser)) {
          saveLoginPreference(remember);
          router.replace(buildCompleteProfileRedirect(safeRedirectUrl));
          return;
        }

        saveLoginPreference(remember);
        router.replace(safeRedirectUrl);
      } else {
        router.replace('/auth');
      }
    };

    void finalizeAuth();
  }, [router, searchParams, supabase]);

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center px-4">
      <div className="absolute left-0 top-0 -z-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 -z-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />

      <div className="auth-fade-in w-full max-w-md rounded-2xl border border-emerald-100 bg-white/95 p-8 text-center shadow-[0_16px_50px_-28px_rgba(22,50,39,0.4)] backdrop-blur">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Leaf className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-emerald-950">Ολοκλήρωση σύνδεσης...</h1>
        <p className="mt-2 text-sm text-slate-600">Θα μεταφερθείτε αυτόματα σε λίγα δευτερόλεπτα.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
