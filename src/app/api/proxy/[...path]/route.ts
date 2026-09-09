import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken || !(await verifySessionToken(sessionToken))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiBase = process.env.BACKEND_API_BASE_URL;
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiBase || !apiKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const { path } = await params;
  const upstreamPath = path.join('/');
  const search = req.nextUrl.search;
  const upstreamUrl = `${apiBase}/admin/${upstreamPath}${search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  let body: BodyInit | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const text = await req.text();
    if (text) body = text;
  }

  const upstream = await fetch(upstreamUrl, {
    method: req.method,
    headers,
    body,
  });

  const data = await upstream.text();
  return new NextResponse(data || null, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
    },
  });
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
