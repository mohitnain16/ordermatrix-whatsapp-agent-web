export async function sendWhatsAppMessage(
  phoneNumberId: string,
  metaToken: string,
  to: string,
  text: string
): Promise<void> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${metaToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`WhatsApp send failed [${res.status}]: ${err}`);
  }
}
