# Authentication (Supabase) — Local dev notes

Required env vars (.env.local):

- NEXT_PUBLIC_SUPABASE_URL - your Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY - your anon key
- NEXT_PUBLIC_BASE_URL - http://localhost:3000 (used for redirect)

Supabase console:
- Go to Auth → Settings → Redirect URLs and add:
  - http://localhost:3000/auth/callback

Local dev cookie behavior:
- For local development we set `SameSite=lax` and `secure=false` so cookies work on HTTP.
- In production `secure=true` is enforced.

Debugging tips:
- Inspect `/api/auth/start` response headers for `Set-Cookie` to confirm PKCE verifier storage.
- Inspect browser Cookies for keys containing `-code-verifier` before the callback exchange.
- If PKCE fails, verify cookies are present and not blocked by browser extensions.

If you want stricter cookie settings or to use HTTPS in dev, let me know and I'll add guidance for local TLS (mkcert) or adjust cookieOptions.
