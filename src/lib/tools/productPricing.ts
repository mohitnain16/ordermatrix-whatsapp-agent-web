import { isTestMode } from '../testStore';

export interface ProductPricingArgs {
  productName: string;
  size?: string;
}

export async function productPricing({ productName, size }: ProductPricingArgs): Promise<string> {
  if (isTestMode()) {
    return `[Test mode] Product pricing is not available — MongoDB is disabled. Asked for: ${productName}${size ? ` (size ${size})` : ''}.`;
  }

  // TODO: query product catalog from DB
  // const { ProductModel } = await import('../models/Product');
  // const product = await ProductModel.findOne({ name: new RegExp(productName, 'i') }).lean();
  // if (!product) return `No product found matching "${productName}".`;
  // const variant = size ? product.variants?.find((v) => v.size === size) : product.variants?.[0];
  // return `${product.name}${size ? ` (${size})` : ''}: ₹${variant?.price ?? product.basePrice}. In stock: ${variant?.stock ?? product.stock}.`;
  throw new Error('Production DB path not implemented — set TEST_MODE=true');
}

export const productPricingDeclaration = {
  name: 'productPricing',
  description: 'Look up the price and stock availability of a product by name and optional size.',
  parameters: {
    type: 'object',
    properties: {
      productName: { type: 'string', description: 'Name or partial name of the product' },
      size: { type: 'string', description: 'Size variant — e.g. S, M, L, XL, Free Size (optional)' },
    },
    required: ['productName'],
  },
};
