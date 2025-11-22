export type Product = {
  id: string;
  name: string;
  basePrice: number; // harga dasar sebelum promo
  image?: string; // path gambar (public/images/...)
  active?: boolean; // bisa dipakai untuk hide sementara
};

export type CartItem = {
  product: Product;
  quantity: number;
  pricePerUnit: number; // harga setelah promo diterapkan
  isFree?: boolean; // item gratis (promo FREE_ITEMS)
};

export enum PromotionType {
  NONE = 'NONE',
  ALL_3000 = 'ALL_3000',
  FREE_ITEMS = 'FREE_ITEMS',
  HALF_PRICE = 'HALF_PRICE'
}

export interface SaleRecordItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isFree?: boolean;
}

export interface SaleRecord {
  id: string;
  timestamp: number; // epoch ms
  items: SaleRecordItem[];
  promotion: PromotionType;
  grossTotal: number; // sebelum promo (untuk analisa jika perlu)
  netTotal: number; // setelah promo
  paymentMethod: 'CASH' | 'QRIS';
  cashGiven?: number;
  change?: number;
  qrisAmount?: number; // nominal yang dibayar via QRIS
  qrisProof?: string; // data URL atau URL upload bukti
  qrisNote?: string; // keterangan tambahan
  staffEmail?: string;
}

export interface StockItem {
  productId: string;
  name: string;
  quantity: number; // current stock quantity
}

export interface UserProfile {
  id: string;
  username: string; // username login atau email jika via Supabase
  role: 'staff' | 'owner';
}
