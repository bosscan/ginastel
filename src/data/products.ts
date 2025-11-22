import { Product } from '../types';

// Daftar produk & harga dasar (Rupiah)
export const products: Product[] = [
  { id: 'es_teh', name: 'Es Teh', basePrice: 3000, image: '/images/es_teh.webp' },
  { id: 'teh_panas', name: 'Teh Panas', basePrice: 3000, image: '/images/teh_panas.webp' },
  { id: 'es_lemon_tea', name: 'Es Lemon Tea', basePrice: 4000, image: '/images/es_lemon_tea.webp' },
  { id: 'lemon_tea_panas', name: 'Lemon Tea Panas', basePrice: 4000, image: '/images/lemon_tea_panas.webp' },
  { id: 'es_sirup_prambos', name: 'Es Sirup Prambos', basePrice: 5000, image: '/images/es_sirup_prambos.webp' },
  { id: 'es_sirup_melon', name: 'Es Sirup Melon', basePrice: 5000, image: '/images/es_sirup_melon.webp' },
  { id: 'es_sirup_mangga', name: 'Es Sirup Mangga', basePrice: 5000, image: '/images/generic_5000.svg' },
  { id: 'es_sirup_moka', name: 'Es Sirup Moka', basePrice: 5000, image: '/images/generic_5000.svg' },
  { id: 'es_teh_susu', name: 'Es Teh Susu', basePrice: 5000, image: '/images/generic_5000.svg' },
  { id: 'es_jeruk', name: 'Es Jeruk', basePrice: 5000, image: '/images/generic_5000.svg' },
  { id: 'es_teh_coklat', name: 'Es Teh Coklat', basePrice: 5000, image: '/images/generic_5000.svg' },
  { id: 'es_teh_alpukat', name: 'Es Teh Alpukat', basePrice: 5000, image: '/images/generic_5000.svg' },
  { id: 'es_teh_durian', name: 'Es Teh Durian', basePrice: 5000, image: '/images/generic_5000.svg' },
  { id: 'es_teh_leci', name: 'Es Teh Leci', basePrice: 5000, image: '/images/generic_5000.svg' },
  { id: 'es_teh_taro', name: 'Es Teh Taro', basePrice: 5000, image: '/images/generic_5000.svg' },
  { id: 'es_teh_coffee_latte', name: 'Es Teh Coffee Latte', basePrice: 5000, image: '/images/generic_5000.svg' },
  { id: 'es_teh_strawberry', name: 'Es Teh Strawberry', basePrice: 5000, image: '/images/generic_5000.svg' },
  { id: 'es_teh_green_tea', name: 'Es Teh Green Tea', basePrice: 5000, image: '/images/generic_5000.svg' },
  { id: 'es_teh_permen_karet', name: 'Es Teh Permen Karet', basePrice: 5000, image: '/images/generic_5000.svg' },
  // Item khusus kerusakan gelas (bukan dijual, price=0, bisa dicatat di stock report)
  { id: 'gelas_besar_rusak', name: 'Gelas Besar Rusak', basePrice: 0 },
  { id: 'gelas_kecil_rusak', name: 'Gelas Kecil Rusak', basePrice: 0 },
];

export const productMap: Record<string, Product> = Object.fromEntries(
  products.map(p => [p.id, p])
);
