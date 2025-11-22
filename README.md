# Es Teh Ginastel Kasir Web App

Aplikasi kasir sederhana untuk outlet Es Teh Ginastel. Dibuat dengan React + TypeScript + Vite. Dapat dideploy ke Vercel dan menggunakan Supabase untuk autentikasi (opsional, fallback dummy login).

## Fitur
  - Reguler (NONE)
  - All Variant 3000 (ALL_3000)
  - Gratis 1 / lebih (FREE_ITEMS) — item tambahan ditandai gratis
  - Diskon 50% (HALF_PRICE)

## Menjalankan Lokal
Install dependencies:
```bash
npm install
npm run dev
```
Buka http://localhost:5173

Dummy akun: 

## Environment Supabase
Buat file `.env` (atau set di Vercel) dengan:
```
VITE_SUPABASE_URL=YOUR_URL
VITE_SUPABASE_ANON_KEY=YOUR_KEY
```
User Supabase harus punya `user_metadata.role` = `staff` atau `owner`.

## Struktur Direktori Ringkas

## Rencana Pengembangan Lanjutan

## Deploy ke Vercel
1. Push repo ke GitHub.
2. Buat project baru di Vercel, import repo.
3. Set env var Supabase di dashboard.
4. Build otomatis (`npm run build`).

## Lisensi
Private untuk kebutuhan internal outlet.
Aplikasi kasir modern untuk outlet Es Teh Ginastel dibangun dengan **React + TypeScript + Vite**. Mendukung promo, metode pembayaran Cash & QRIS (dengan foto bukti), manajemen stok, laporan penjualan lengkap (filter + ekspor CSV), serta UI mobile friendly bertema dark café.

## Fitur Utama
- Login 2 role: Penjaga Outlet & Owner (owner punya akses Input Stok)
- Katalog produk + pencarian dengan highlight
- Promo:
  - Reguler
  - All Variant Rp 3.000
  - Gratis Item (tambah item free)
  - Diskon 50%
- Pembayaran:
  - Cash (hitung otomatis kembalian)
  - QRIS (input nominal, bukti foto kamera, catatan)
- Laporan Penjualan:
  - Filter tanggal, metode pembayaran, cari item
  - Summary transaksi (modal detail) + ekspor CSV sesuai filter
  - Breakdown pendapatan per produk & daftar item gratis
- Manajemen Stok (owner)
- Desain responsif: floating cart di mobile, hamburger navigation
- Persistensi lokal (localStorage) siap migrasi ke Supabase

## Menjalankan Lokal
```bash
npm install
npm run dev
```
Buka: http://localhost:5173

Dummy akun (username / password):
- penjaga_outlet / ginastel123
- owner_outlet / ginastelf2

## Struktur Direktori
```
src/
  components/        # Komponen UI
  context/           # Auth, Cart, Stock providers
  data/              # Produk
  lib/               # Logika promo
  types.ts           # Definisi tipe
```

## Build & Preview
```bash
npm run build
npm run preview
```

## Deploy ke Vercel
1. Push repo ke GitHub (lihat bagian Git).
2. Import ke Vercel.
3. (Opsional) Tambahkan env Supabase bila migrasi backend.
4. Build otomatis.

## Migrasi ke Supabase (Rencana)
- Tabel: products, sales, stock_movements, users.
- Ganti localStorage di CartContext & StockContext dengan query Supabase.
- Row Level Security untuk multi outlet.

## Ekspor & Data
- CSV transaksi mengikuti filter aktif.
- Breakdown pendapatan: klik kartu Total Pendapatan.

## Git (.gitignore sudah ada)
Inisialisasi & push pertama:
```bash
git init
git add .
git commit -m "feat: initial Ginastel POS implementation"
git branch -M main
git remote add origin https://github.com/bosscan/ginastel.git
git push -u origin main
```
Jika prompt password: gunakan Personal Access Token (PAT) GitHub.

## Next Improvements
- Chart penjualan harian/mingguan
- PDF / cetak struk
- Persistensi Supabase penuh
- Service worker (offline / PWA)
- Multi outlet & shift tracking

## Lisensi
Internal; bisa diubah ke MIT bila diperlukan.
