import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies as nextCookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = body?.url;
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    const cookieStore = nextCookies();
    const cookiesWrapper: any = {
      get: (name: string) => {
        const c = cookieStore.get(name);
        return c ? c.value : null;
      },
      set: (name: string, value: string, options?: any) => {
        try {
          // @ts-ignore
          cookieStore.set({ name, value, ...(options ?? {}) });
        } catch {
          try {
            // @ts-ignore
            cookieStore.set(name, value);
          } catch (e) {
            // ignore
          }
        }
      },
      remove: (name: string) => {
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

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', {
      cookies: cookiesWrapper,
    } as any);

    // Try server-side exchange using the full callback URL
    const authAny = (supabase.auth as any);
    let result: any = null;

    if (typeof authAny.exchangeCodeForSession === 'function') {
      result = await authAny.exchangeCodeForSession(url);
    } else if (typeof authAny.getSessionFromUrl === 'function') {
      result = await authAny.getSessionFromUrl({ url, storeSession: true });
    } else {
      // Unsupported: return helpful error
      return NextResponse.json({ error: 'Server SDK does not support code exchange' }, { status: 500 });
    }

    if (result?.error) {
      console.error('exchange error', result.error);
      return NextResponse.json({ error: result.error.message ?? String(result.error) }, { status: 500 });
    }

    // On success redirect to dashboard. Cookies should be set by createServerClient.
    const origin = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
    return NextResponse.redirect(new URL('/farmer/dashboard', origin));
  } catch (e: any) {
    console.error('exchange exception', e);
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
