import { isTestMode } from '../testStore';

export interface PaymentFlagArgs {
  orderId: string;
  customerPhone: string;
  amount: number;
}

export async function paymentFlag({ orderId, customerPhone, amount }: PaymentFlagArgs): Promise<string> {
  if (isTestMode()) {
    return `[Test mode] Payment flagging is not available — MongoDB is disabled. Would have flagged order ${orderId} (₹${amount}) for ${customerPhone}.`;
  }

  // TODO: create PaymentFlag document in DB
  // const { PaymentFlagModel } = await import('../models/PaymentFlag');
  // await PaymentFlagModel.create({ orderId, customerPhone, amount, flaggedAt: new Date(), status: 'pending' });
  // return `Payment of ₹${amount} for order ${orderId} has been flagged for manual review.`;
  throw new Error('Production DB path not implemented — set TEST_MODE=true');
}

export const paymentFlagDeclaration = {
  name: 'paymentFlag',
  description: 'Flag a payment for manual review by the operations team.',
  parameters: {
    type: 'object',
    properties: {
      orderId: { type: 'string', description: 'Order ID to flag' },
      customerPhone: { type: 'string', description: 'Customer WhatsApp number (with country code)' },
      amount: { type: 'number', description: 'Payment amount in INR' },
    },
    required: ['orderId', 'customerPhone', 'amount'],
  },
};
