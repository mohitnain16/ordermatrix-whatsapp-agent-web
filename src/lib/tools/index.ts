import { productPricing, productPricingDeclaration, type ProductPricingArgs } from './productPricing';
import { paymentFlag, paymentFlagDeclaration, type PaymentFlagArgs } from './paymentFlag';

export const toolDeclarations = [productPricingDeclaration, paymentFlagDeclaration];

export type ToolName = 'productPricing' | 'paymentFlag';

export async function callTool(name: ToolName, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'productPricing':
      return productPricing(args as unknown as ProductPricingArgs);
    case 'paymentFlag':
      return paymentFlag(args as unknown as PaymentFlagArgs);
    default:
      return `Unknown tool: ${name as string}`;
  }
}
