import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken || !(await verifySessionToken(sessionToken))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiBase = process.env.BACKEND_API_BASE_URL;
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiBase || !apiKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const { mediaId } = await params;
  const search = req.nextUrl.search; // preserves ?tenantId=...
  const upstreamUrl = `${apiBase}/admin/media/${encodeURIComponent(mediaId)}${search}`;

  const upstream = await fetch(upstreamUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => upstream.statusText);
    return new NextResponse(text || null, { status: upstream.status });
  }

  const buffer = await upstream.arrayBuffer();

  const resHeaders: Record<string, string> = {
    'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
  };
  const contentLength = upstream.headers.get('Content-Length');
  if (contentLength) resHeaders['Content-Length'] = contentLength;
  const cacheControl = upstream.headers.get('Cache-Control');
  if (cacheControl) resHeaders['Cache-Control'] = cacheControl;

  return new NextResponse(buffer, { status: 200, headers: resHeaders });
}
