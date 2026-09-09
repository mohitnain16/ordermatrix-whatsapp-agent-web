import type { Tenant } from './types';
import { isTestMode, TEST_TENANT } from './testStore';

export async function getTenantByPhoneNumberId(phoneNumberId: string): Promise<Tenant | null> {
  if (isTestMode()) {
    return TEST_TENANT.phoneNumberId === phoneNumberId ? TEST_TENANT : null;
  }

  // TODO: query Tenant collection when MongoDB is wired up
  // const { TenantModel } = await import('./models/Tenant');
  // return TenantModel.findOne({ phoneNumberId }).lean<Tenant>();
  throw new Error('Production DB path not implemented — set TEST_MODE=true');
}
