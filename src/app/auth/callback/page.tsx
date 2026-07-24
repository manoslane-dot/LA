'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
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
        router.replace('/farmer/dashboard');
      } else {
        router.replace('/auth');
      }
    };

    void finalizeAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">Finalizing sign-in...</h1>
        <p className="mt-2 text-sm text-gray-500">You’ll be redirected shortly.</p>
      </div>
    </div>
  );
}
