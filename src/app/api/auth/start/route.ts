import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies as nextCookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const provider = body?.provider ?? 'google';

    // Wrap Next cookies API into the shape expected by the auth helper.
    const cookieStore = nextCookies();
    const cookieOps: Array<{ op: string; name: string; options?: any }> = [];
    const cookiesWrapper: any = {
      get: (name: string) => {
        cookieOps.push({ op: 'get', name });
        const c = cookieStore.get(name);
        return c ? c.value : null;
      },
      set: (name: string, value: string, options?: any) => {
        cookieOps.push({ op: 'set', name, options });
        try {
          // Next's cookies().set accepts either object or (name, value)
          // Use the object form if available
          // @ts-ignore
          cookieStore.set({ name, value, ...(options ?? {}) });
        } catch {
          try {
            // fallback to simple set
            // @ts-ignore
            cookieStore.set(name, value);
          } catch (e) {
            // ignore
          }
        }
      },
      remove: (name: string, options?: any) => {
        cookieOps.push({ op: 'remove', name, options });
        try {
          // @ts-ignore
          cookieStore.delete(name);
        } catch {
          try {
            // @ts-ignore
            cookieStore.set(name, '', { maxAge: 0 });
          } catch (e) {
            // ignore
          }
        }
      },
    };

    const cookieOptions = {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    };

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      {
        cookies: cookiesWrapper,
        cookieOptions,
      } as any
    );

    const origin = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
    const redirectTo = `${origin}/auth/callback`;

    console.log('Starting OAuth', { provider, redirectTo, cookieOptions });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      console.error('signInWithOAuth error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Log cookie ops observed while creating the URL / setting PKCE verifier
    console.log('cookieOps during start:', cookieOps);

    return NextResponse.json({ url: (data as any)?.url ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
