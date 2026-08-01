import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/env';

type DeletePayload = {
  method?: 'password' | 'email';
  password?: string;
  confirmEmail?: string;
};

const getUserAuthErrorMessage = (message?: string) => {
  const normalizedMessage = message?.toLowerCase() ?? '';

  if (normalizedMessage.includes('sub claim') || normalizedMessage.includes('jwt') || normalizedMessage.includes('token')) {
    return 'Η συνεδρία είναι άκυρη ή έληξε. Συνδεθείτε ξανά και δοκιμάστε ξανά.';
  }

  if (normalizedMessage.includes('not found') || normalizedMessage.includes('no user')) {
    return 'Δεν βρέθηκε ενεργός χρήστης.';
  }

  return 'Δεν βρέθηκε ενεργός χρήστης.';
};

export async function POST(request: Request) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Λείπει η ρύθμιση Supabase για διαγραφή λογαριασμού.' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Μη εξουσιοδοτημένο αίτημα.' }, { status: 401 });
  }

  const accessToken = authHeader.replace('Bearer ', '').trim();
  const body = (await request.json()) as DeletePayload;
  const method = body.method;

  if (!method || (method !== 'password' && method !== 'email')) {
    return NextResponse.json({ error: 'Μη έγκυρη μέθοδος επιβεβαίωσης.' }, { status: 400 });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: getUserAuthErrorMessage(userError?.message) }, { status: 401 });
  }

  if (method === 'email') {
    const normalizedConfirmEmail = (body.confirmEmail ?? '').trim().toLowerCase();
    const normalizedUserEmail = (user.email ?? '').trim().toLowerCase();

    if (!normalizedConfirmEmail || normalizedConfirmEmail !== normalizedUserEmail) {
      return NextResponse.json(
        { error: 'Το email επιβεβαίωσης δεν ταιριάζει.' },
        { status: 400 },
      );
    }
  }

  if (method === 'password') {
    const password = body.password ?? '';
    if (!password) {
      return NextResponse.json({ error: 'Απαιτείται κωδικός επιβεβαίωσης.' }, { status: 400 });
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'Δεν είναι διαθέσιμο email λογαριασμού για επιβεβαίωση.' },
        { status: 400 },
      );
    }

    const verifyClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (verifyError) {
      return NextResponse.json(
        { error: 'Ο κωδικός επιβεβαίωσης δεν είναι σωστός.' },
        { status: 400 },
      );
    }
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json(
      { error: `Αποτυχία διαγραφής λογαριασμού: ${deleteError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
