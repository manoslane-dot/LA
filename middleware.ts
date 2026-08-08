import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getDashboardForRole, normalizeUserRole } from './src/lib/auth/roleRouting';
import { buildCompleteProfileRedirect, hasRequiredContactInfo } from './src/lib/auth/contactInfo';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function buildAuthRedirect(request: NextRequest): NextResponse {
  const redirectUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const authUrl = new URL('/auth', request.url);
  authUrl.searchParams.set('redirectUrl', redirectUrl);
  return NextResponse.redirect(authUrl);
}

export async function middleware(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildAuthRedirect(request);
  }

  if (!hasRequiredContactInfo(user)) {
    return NextResponse.redirect(new URL(buildCompleteProfileRedirect(`${request.nextUrl.pathname}${request.nextUrl.search}`), request.url));
  }

  const path = request.nextUrl.pathname;
  const role = normalizeUserRole(user.user_metadata?.role);

  if (path.startsWith('/consumer') && role === 'farmer') {
    return NextResponse.redirect(new URL(getDashboardForRole('farmer'), request.url));
  }

  if (path.startsWith('/farmer') && role === 'consumer') {
    return NextResponse.redirect(new URL(getDashboardForRole('consumer'), request.url));
  }

  return response;
}

export const config = {
  matcher: ['/consumer/:path*', '/farmer/:path*'],
};
