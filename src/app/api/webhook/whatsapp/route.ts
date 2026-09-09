import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { getTenantByPhoneNumberId } from '@/lib/tenant';
import { getHistory, appendMessage } from '@/lib/conversationHistory';
import { runGeminiLoop } from '@/lib/gemini';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WaMessageText { body: string }

interface WaMessage {
  id: string;
  from: string;
  type: string;
  timestamp: string;
  text?: WaMessageText;
}

interface WaMetadata { phone_number_id: string; display_phone_number: string }

interface WaChangeValue {
  messaging_product: string;
  metadata: WaMetadata;
  messages?: WaMessage[];
  statuses?: unknown[];
}

interface WaChange { field: string; value: WaChangeValue }
interface WaEntry { id: string; changes: WaChange[] }
interface WaPayload { object: string; entry: WaEntry[] }

// ─── Signature verification ───────────────────────────────────────────────────

function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    // Warn and allow through — useful when testing without a real Meta secret
    console.warn('[webhook] META_APP_SECRET not set — skipping signature check');
    return true;
  }
  if (!signatureHeader) return false;

  const expected =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── GET — Meta webhook verification challenge ────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ─── POST — Incoming WhatsApp messages ───────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Read raw body before any parsing (needed for HMAC)
  const rawBody = await req.text();

  if (!verifyMetaSignature(rawBody, req.headers.get('x-hub-signature-256'))) {
    console.warn('[webhook] Signature mismatch — rejecting request');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: WaPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // ── Filter: only handle message entries ──────────────────────────────────
  const change = payload?.entry?.[0]?.changes?.[0];
  if (change?.field !== 'messages') {
    return NextResponse.json({ status: 'ignored' });
  }

  const value = change.value;

  // Ignore delivery/read receipts
  if (!value.messages?.length) {
    return NextResponse.json({ status: 'ignored' });
  }

  const msg = value.messages[0];

  // Only handle incoming text messages
  if (msg.type !== 'text' || !msg.text?.body?.trim()) {
    return NextResponse.json({ status: 'ignored' });
  }

  const phoneNumberId = value.metadata?.phone_number_id;
  const fromPhone = msg.from;
  const userText = msg.text.body.trim();

  if (!phoneNumberId || !fromPhone) {
    return NextResponse.json({ status: 'ignored' });
  }

  // ── Core flow ─────────────────────────────────────────────────────────────
  await connectDB();

  const tenant = await getTenantByPhoneNumberId(phoneNumberId);
  if (!tenant) {
    console.warn(`[webhook] No tenant found for phoneNumberId=${phoneNumberId}`);
    return NextResponse.json({ status: 'ignored' });
  }

  const history = await getHistory(fromPhone);

  const replyText = await runGeminiLoop(tenant, history, userText);

  // Persist to history (no-op in TEST_MODE)
  await appendMessage(fromPhone, { role: 'user', parts: [{ text: userText }] });
  await appendMessage(fromPhone, { role: 'model', parts: [{ text: replyText }] });

  await sendWhatsAppMessage(tenant.phoneNumberId, tenant.metaToken, fromPhone, replyText);

  console.log(`[webhook] Replied to ${fromPhone}: "${replyText.slice(0, 80)}..."`);
  return NextResponse.json({ status: 'ok' });
}
