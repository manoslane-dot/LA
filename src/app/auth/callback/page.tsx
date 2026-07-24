'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">Finalizing sign-in...</h1>
        <p className="mt-2 text-sm text-gray-500">You’ll be redirected shortly.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
