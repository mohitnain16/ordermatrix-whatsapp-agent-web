/**
 * In-memory stores used when TEST_MODE=true.
 * This module is always importable — the stores are only populated when TEST_MODE is active.
 */

import type { Tenant, ChatMessage } from './types';

export function isTestMode(): boolean {
  return process.env.TEST_MODE === 'true';
}

// Hardcoded Chalti Fashions business info — the first real tenant
const CHALTI_BUSINESS_INFO = {
  name: 'Chalti Fashions',
  description:
    'A trendy fashion brand offering kurti sets, co-ord sets, and ethnic wear for women. ' +
    'Specialises in comfortable daily-wear and festive collections at affordable prices.',
  category: 'Fashion & Clothing',
  greeting:
    'Namaste! Welcome to Chalti Fashions 🛍️ How can I help you find the perfect outfit today?',
  supportEmail: 'support@chaltifashions.com',
};

export const TEST_TENANT: Tenant = {
  _id: 'test-tenant-001',
  phoneNumberId: process.env.TEST_PHONE_NUMBER_ID ?? '',
  wabaId: process.env.TEST_WABA_ID ?? '',
  metaToken: process.env.TEST_META_TOKEN ?? '',
  businessInfo: CHALTI_BUSINESS_INFO,
};

// In-memory conversation history: phoneNumber → last MAX_HISTORY messages
const MAX_HISTORY = 20;
const historyStore = new Map<string, ChatMessage[]>();

export function getTestHistory(phoneNumber: string): ChatMessage[] {
  return [...(historyStore.get(phoneNumber) ?? [])];
}

export function appendTestMessage(phoneNumber: string, message: ChatMessage): void {
  const history = historyStore.get(phoneNumber) ?? [];
  history.push(message);
  // Keep only the last MAX_HISTORY messages
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  historyStore.set(phoneNumber, history);
}
