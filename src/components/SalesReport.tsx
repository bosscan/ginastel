import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { PromotionType, SaleRecord } from '../types';
import Modal from './Modal';
import PaymentMethodSelect from './PaymentMethodSelect';

const SalesReport: React.FC = () => {
  const { sales } = useCart();
  const [dateFilter, setDateFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);

  const promoLabel: Record<PromotionType, string> = {
    [PromotionType.NONE]: 'Reguler',
    [PromotionType.ALL_3000]: 'All 3000',
    [PromotionType.FREE_ITEMS]: 'Gratis Item',
    [PromotionType.HALF_PRICE]: 'Diskon 50%'
  };

  function formatDate(timestamp: number) {
    const d = new Date(timestamp);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatTime(timestamp: number) {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateTime(timestamp: number) {
    const d = new Date(timestamp);
    return d.toLocaleString('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Helper to get local date (YYYY-MM-DD) instead of UTC ISO (avoids off-by-one for early morning times)
  function localDateString(ts: number) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (dateFilter) {
        const saleDate = localDateString(s.timestamp);
        if (saleDate !== dateFilter) return false;
      }
      if (paymentFilter !== 'ALL' && s.paymentMethod !== paymentFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const hasMatch = s.items.some(i => i.name.toLowerCase().includes(term));
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [sales, dateFilter, paymentFilter, searchTerm]);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.netTotal, 0);
  const totalTransactions = filteredSales.length;

  // Aggregations for revenue modal
  const productSales = useMemo(() => {
    const map: Record<string, { name: string; qty: number; amount: number }> = {};
    filteredSales.forEach(s => {
      s.items.forEach(i => {
        if (i.isFree) return; // exclude free items from paid totals
        const entry = map[i.productId] || { name: i.name, qty: 0, amount: 0 };
        entry.qty += i.quantity;
        entry.amount += i.total; // total already includes unitPrice * quantity
        map[i.productId] = entry;
      });
    });
    return Object.values(map).sort((a,b) => b.qty - a.qty);
  }, [filteredSales]);

  const freeItems = useMemo(() => {
    const map: Record<string, { name: string; qty: number }> = {};
    filteredSales.forEach(s => {
      s.items.forEach(i => {
        if (!i.isFree) return;
        const entry = map[i.productId] || { name: i.name, qty: 0 };
        entry.qty += i.quantity;
        map[i.productId] = entry;
      });
    });
    return Object.values(map).sort((a,b) => b.qty - a.qty);
  }, [filteredSales]);

  function exportToExcel() {
    const source = filteredSales; // export matches current filter view
    if (source.length === 0) return;
    const headers = ['Tanggal', 'Metode Pembayaran', 'Promo', 'Metode (Badge)', 'Items', 'Gross', 'Net Total', 'Kembalian'];
    const rows = source.map(s => [
      formatDateTime(s.timestamp),
      s.paymentMethod,
      promoLabel[s.promotion],
      s.paymentMethod, // duplicate for clarity; badge vs plain text
      s.items.map(i => `${i.name} x${i.quantity}${i.isFree ? ' (FREE)' : ''}`).join('; '),
      s.grossTotal,
      s.netTotal,
      s.change ?? ''
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const datePart = dateFilter || new Date().toISOString().split('T')[0];
    link.download = `sales_report_${datePart}.csv`;
    link.click();
  }

  return (
    <div className="report-sales">
      <div className="report-header">
        <h2>Report Penjualan</h2>
        <div className="report-filters">
          <div className="filter-block">
            <label className="filter-label" htmlFor="filterDate">Tanggal</label>
            <input 
              id="filterDate"
              type="date" 
              className="filter-date" 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)} 
            />
          </div>
          <PaymentMethodSelect value={paymentFilter} onChange={setPaymentFilter} />
          <div className="filter-block">
            <label className="filter-label" htmlFor="filterSearch">Cari Item</label>
            <input 
              id="filterSearch"
              type="text" 
              className="filter-search" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Ketik nama produk"
            />
          </div>
          {(dateFilter || paymentFilter !== 'ALL' || searchTerm) && (
            <button 
              className="filter-reset" 
              onClick={() => { setDateFilter(''); setPaymentFilter('ALL'); setSearchTerm(''); }}
            >
              Reset
            </button>
          )}
        </div>
        <div className="report-summary">
          <div className="summary-card clickable" onClick={() => setShowSummaryModal(true)}>
            <div className="summary-label">Total Transaksi</div>
            <div className="summary-value">{totalTransactions}</div>
            <div className="summary-hint">Klik untuk detail</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Pendapatan</div>
            <div className="summary-value clickable" onClick={() => setShowRevenueModal(true)}>Rp {totalRevenue.toLocaleString('id-ID')}</div>
          </div>
        </div>
      </div>
      {filteredSales.length === 0 && (
        <div className="no-sales">
          {sales.length === 0 ? 'Belum ada transaksi penjualan' : 'Tidak ada transaksi yang cocok dengan filter'}
        </div>
      )}
      <div className="sales-list">
        {filteredSales.map(s => (
          <div key={s.id} className="sale-card">
            <div className="sale-header">
              <div className="sale-date">
                <span className="date-main">{formatDate(s.timestamp)}</span>
                <span className="date-time">{formatTime(s.timestamp)}</span>
              </div>
              <div className="sale-badges">
                <span className="badge badge-promo">{promoLabel[s.promotion]}</span>
                <span className={`badge badge-payment ${s.paymentMethod === 'CASH' ? 'badge-cash' : 'badge-qris'}`}>
                  {s.paymentMethod}
                </span>
              </div>
            </div>
            <div className="sale-items">
              {s.items.map(i => (
                <div key={i.productId + (i.isFree ? '_free' : '')} className={`sale-item ${i.isFree ? 'free-item' : ''}`}>
                  <span className="item-name">{i.name}</span>
                  <span className="item-qty">×{i.quantity}</span>
                  <span className="item-price">Rp {i.total.toLocaleString('id-ID')}</span>
                  {i.isFree && <span className="free-badge">FREE</span>}
                </div>
              ))}
            </div>
            <div className="sale-footer">
              <div className="sale-total">
                <span className="total-label">Total</span>
                <span className="total-value">Rp {s.netTotal.toLocaleString('id-ID')}</span>
              </div>
              {s.paymentMethod === 'CASH' && s.change !== undefined && (
                <div className="sale-change">Kembalian: Rp {s.change.toLocaleString('id-ID')}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Modal */}
      <Modal 
        open={showSummaryModal} 
        onClose={() => setShowSummaryModal(false)} 
        title="Summary Transaksi" 
        width={1000}
        footer={
          <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
            <button className="modal-secondary" onClick={() => setShowSummaryModal(false)}>Tutup</button>
            <button className="modal-primary" onClick={exportToExcel}>Download Excel (CSV)</button>
          </div>
        }
      >
        <div className="summary-table-wrapper">
          <table className="summary-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Metode Pembayaran</th>
                <th>Promo</th>
                <th>Metode (Badge)</th>
                <th>Items</th>
                <th>Gross</th>
                <th>Net Total</th>
                <th>Kembalian</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} style={{textAlign:'center', padding:'24px 12px', fontWeight:600, color:'#a3b1c2'}}>
                    Tidak ada transaksi untuk filter ini
                  </td>
                </tr>
              )}
              {filteredSales.map(s => (
                <tr key={s.id}>
                  <td>{formatDateTime(s.timestamp)}</td>
                  <td>{s.paymentMethod}</td>
                  <td><span className="table-badge">{promoLabel[s.promotion]}</span></td>
                  <td><span className={`table-badge badge-${s.paymentMethod.toLowerCase()}`}>{s.paymentMethod}</span></td>
                  <td className="items-cell">
                    {s.items.map(i => (
                      <div key={i.productId + (i.isFree?'_f':'')} className="item-row">
                        {i.name} ×{i.quantity} {i.isFree && <span className="free-tag">FREE</span>}
                      </div>
                    ))}
                  </td>
                  <td className="num-cell">Rp {s.grossTotal.toLocaleString('id-ID')}</td>
                  <td className="num-cell"><strong>Rp {s.netTotal.toLocaleString('id-ID')}</strong></td>
                  <td className="num-cell">{s.change !== undefined ? `Rp ${s.change.toLocaleString('id-ID')}` : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5}><strong>Total</strong></td>
                <td className="num-cell"><strong>Rp {filteredSales.reduce((s,r)=>s+r.grossTotal,0).toLocaleString('id-ID')}</strong></td>
                <td className="num-cell"><strong>Rp {filteredSales.reduce((s,r)=>s+r.netTotal,0).toLocaleString('id-ID')}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Modal>

      {/* Revenue Breakdown Modal */}
      <Modal
        open={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        title="Ringkasan Pendapatan per Produk"
        width={900}
        footer={
          <div style={{display:'flex', justifyContent:'flex-end', width:'100%'}}>
            <button className="modal-secondary" onClick={() => setShowRevenueModal(false)}>Tutup</button>
          </div>
        }
      >
        <div className="summary-table-wrapper">
          <table className="summary-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Produk</th>
                <th>Jumlah Terjual</th>
                <th>Total Nominal Terjual</th>
              </tr>
            </thead>
            <tbody>
              {productSales.length === 0 && (
                <tr><td colSpan={4} style={{textAlign:'center', padding:'20px 12px', color:'#a3b1c2'}}>Tidak ada penjualan untuk filter ini</td></tr>
              )}
              {productSales.map((p, idx) => (
                <tr key={p.name}>
                  <td className="num-cell">{idx + 1}</td>
                  <td>{p.name}</td>
                  <td className="num-cell">{p.qty}</td>
                  <td className="num-cell">Rp {p.amount.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
            {productSales.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2}><strong>Total</strong></td>
                  <td className="num-cell"><strong>{productSales.reduce((s,r)=>s+r.qty,0)}</strong></td>
                  <td className="num-cell"><strong>Rp {productSales.reduce((s,r)=>s+r.amount,0).toLocaleString('id-ID')}</strong></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div style={{marginTop:'24px'}}>
          <h3 style={{margin:'0 0 12px', fontSize:'16px'}}>Free Items</h3>
          <div className="summary-table-wrapper">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Produk</th>
                  <th>Jumlah Free</th>
                </tr>
              </thead>
              <tbody>
                {freeItems.length === 0 && (
                  <tr><td colSpan={3} style={{textAlign:'center', padding:'20px 12px', color:'#a3b1c2'}}>Tidak ada item gratis untuk filter ini</td></tr>
                )}
                {freeItems.map((f, idx) => (
                  <tr key={f.name}>
                    <td className="num-cell">{idx + 1}</td>
                    <td>{f.name}</td>
                    <td className="num-cell">{f.qty}</td>
                  </tr>
                ))}
              </tbody>
              {freeItems.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={2}><strong>Total Free</strong></td>
                    <td className="num-cell"><strong>{freeItems.reduce((s,r)=>s+r.qty,0)}</strong></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default SalesReport;
