export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('91') && clean.length === 12) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return `+${clean}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const dayMs = 86_400_000;

  if (diff < dayMs && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  if (diff < 2 * dayMs) return 'Yesterday';
  if (diff < 7 * dayMs) {
    return d.toLocaleDateString('en-IN', { weekday: 'short' });
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const dayMs = 86_400_000;

  if (diff < dayMs && d.getDate() === now.getDate()) return 'Today';
  if (diff < 2 * dayMs) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '…';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

const TOOL_LABELS: Record<string, string> = {
  resolve_product_pricing: 'Pricing lookup',
  check_business_legitimacy: 'Business check',
  flag_payment: 'Payment flagged',
  get_order_status: 'Order status',
  send_catalogue: 'Catalogue sent',
};

export function toolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName.replace(/_/g, ' ');
}
