import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Product, PromotionType, SaleRecord } from '../types';
import { applyPromotion, calculateTotals } from '../lib/promotions';
import { productMap } from '../data/products';
import { v4 as uuid } from 'uuid';

interface CartContextValue {
  items: CartItem[];
  promotion: PromotionType;
  addProduct: (product: Product) => void;
  addFreeProduct: (product: Product) => void; // khusus promo FREE_ITEMS
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setPromotion: (promo: PromotionType) => void;
  clearCart: () => void;
  totals: { subtotal: number; totalQuantity: number };
  checkout: (paymentMethod: 'CASH' | 'QRIS', cashGiven?: number, qrisAmount?: number, qrisProof?: string, qrisNote?: string) => { sale: SaleRecord | null; change: number };
  sales: SaleRecord[];
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadSales(): SaleRecord[] {
  try {
    const raw = localStorage.getItem('salesRecords');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSales(sales: SaleRecord[]) {
  localStorage.setItem('salesRecords', JSON.stringify(sales));
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promotion, setPromotion] = useState<PromotionType>(PromotionType.NONE);
  const [sales, setSales] = useState<SaleRecord[]>(loadSales());

  useEffect(() => {
    // reapply promotion when items or promotion changes
    setItems(prev => applyPromotion(prev, promotion));
  }, [promotion]);

  function addProduct(product: Product) {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id && !i.isFree);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1, pricePerUnit: product.basePrice }];
    });
  }

  function addFreeProduct(product: Product) {
    if (promotion !== PromotionType.FREE_ITEMS) return;
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.isFree);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1, pricePerUnit: 0, isFree: true }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i));
  }

  function removeItem(productId: string) {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }

  function clearCart() {
    setItems([]);
    setPromotion(PromotionType.NONE);
  }

  const totals = calculateTotals(items);

  function checkout(paymentMethod: 'CASH' | 'QRIS', cashGiven?: number, qrisAmount?: number, qrisProof?: string, qrisNote?: string) {
    const appliedItems = applyPromotion(items, promotion);
    const grossTotal = appliedItems.reduce((s, i) => s + i.product.basePrice * i.quantity, 0);
    const netTotal = appliedItems.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);
    let change = 0;
    if (paymentMethod === 'CASH') {
      const cg = cashGiven ?? 0;
      change = cg - netTotal;
      if (change < 0) return { sale: null, change }; // pembayaran kurang
    }

    const sale: SaleRecord = {
      id: uuid(),
      timestamp: Date.now(),
      items: appliedItems.map(i => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: i.pricePerUnit,
        total: i.pricePerUnit * i.quantity,
        isFree: i.isFree,
      })),
      promotion,
      grossTotal,
      netTotal,
      paymentMethod,
      cashGiven,
      change: paymentMethod === 'CASH' ? change : undefined,
      qrisAmount: paymentMethod === 'QRIS' ? (qrisAmount ?? netTotal) : undefined,
      qrisProof: paymentMethod === 'QRIS' ? qrisProof : undefined,
      qrisNote: paymentMethod === 'QRIS' ? qrisNote : undefined,
    };
    setSales(prev => {
      const next = [sale, ...prev];
      try {
        saveSales(next);
      } catch (err) {
        console.error('Gagal menyimpan penjualan ke localStorage (mungkin ukuran bukti terlalu besar).', err);
      }
      return next;
    });
    clearCart();
    return { sale, change };
  }

  return (
    <CartContext.Provider value={{ items, promotion, addProduct, addFreeProduct, updateQuantity, removeItem, setPromotion, clearCart, totals, checkout, sales }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
