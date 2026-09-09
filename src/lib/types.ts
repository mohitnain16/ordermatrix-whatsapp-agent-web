export interface TenantBusinessInfo {
  name: string;
  description: string;
  category: string;
  greeting: string;
  supportEmail?: string;
}

export interface Tenant {
  _id: string;
  phoneNumberId: string;
  wabaId: string;
  metaToken: string;
  businessInfo: TenantBusinessInfo;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}
