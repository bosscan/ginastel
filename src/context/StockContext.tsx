import React, { createContext, useContext, useEffect, useState } from 'react';
import { StockItem } from '../types';
import { products } from '../data/products';

interface StockContextValue {
  stock: StockItem[];
  setQuantity: (productId: string, quantity: number) => void;
  adjust: (productId: string, delta: number) => void; // gunakan saat checkout
  reset: () => void;
}

const StockContext = createContext<StockContextValue | undefined>(undefined);

function loadStock(): StockItem[] {
  try {
    const raw = localStorage.getItem('stockItems');
    if (raw) return JSON.parse(raw);
  } catch {}
  // default: inisialisasi semua kuantitas = 0
  return products.filter(p => p.basePrice > 0).map(p => ({ productId: p.id, name: p.name, quantity: 0 }));
}

function saveStock(items: StockItem[]) {
  localStorage.setItem('stockItems', JSON.stringify(items));
}

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stock, setStock] = useState<StockItem[]>(loadStock());

  useEffect(() => {
    saveStock(stock);
  }, [stock]);

  function setQuantity(productId: string, quantity: number) {
    setStock(prev => prev.map(s => s.productId === productId ? { ...s, quantity } : s));
  }

  function adjust(productId: string, delta: number) {
    setStock(prev => prev.map(s => s.productId === productId ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s));
  }

  function reset() {
    setStock(loadStock());
  }

  return (
    <StockContext.Provider value={{ stock, setQuantity, adjust, reset }}>
      {children}
    </StockContext.Provider>
  );
};

export function useStock(): StockContextValue {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStock must be used within StockProvider');
  return ctx;
}
