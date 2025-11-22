import { CartItem, PromotionType } from '../types';

export function applyPromotion(items: CartItem[], promo: PromotionType): CartItem[] {
  switch (promo) {
    case PromotionType.NONE:
      return items.map(i => ({ ...i, pricePerUnit: i.product.basePrice }));
    case PromotionType.ALL_3000:
      return items.map(i => ({ ...i, pricePerUnit: 3000 }));
    case PromotionType.HALF_PRICE:
      return items.map(i => ({ ...i, pricePerUnit: Math.round(i.product.basePrice / 2) }));
    case PromotionType.FREE_ITEMS:
      // Untuk FREE_ITEMS harga normal kecuali item yang ditandai isFree.
      return items.map(i => ({ ...i, pricePerUnit: i.isFree ? 0 : i.product.basePrice }));
    default:
      return items;
  }
}

export function calculateTotals(items: CartItem[]): { subtotal: number; totalQuantity: number } {
  let subtotal = 0;
  let totalQuantity = 0;
  for (const item of items) {
    subtotal += item.pricePerUnit * item.quantity;
    totalQuantity += item.quantity;
  }
  return { subtotal, totalQuantity };
}
