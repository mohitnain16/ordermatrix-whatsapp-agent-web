import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

// Returns the backend WS connection credentials, gated behind the session cookie.
// The ADMIN_API_KEY never leaves the server except through this session-authenticated route.
export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionToken || !(await verifySessionToken(sessionToken))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ADMIN_API_KEY;
  const wsUrl = process.env.BACKEND_API_BASE_URL;

  if (!apiKey || !wsUrl) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  return NextResponse.json({ token: apiKey, wsUrl });
}
