import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { PromotionType } from '../types';
import Modal from './Modal';
import NumericPad from './NumericPad';
import CameraCapture from './CameraCapture';

const CartView: React.FC = () => {
  const { items, promotion, setPromotion, updateQuantity, removeItem, totals, checkout } = useCart();
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [message, setMessage] = useState<string>('');
  const [openPromo, setOpenPromo] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [qrisAmount, setQrisAmount] = useState<number>(0);
  const [qrisProof, setQrisProof] = useState<string | undefined>(undefined);
  const [qrisNote, setQrisNote] = useState<string>('');

  function executeCheckout() {
    setConfirming(true);
    const { sale, change } = checkout(
      paymentMethod,
      paymentMethod === 'CASH' ? cashGiven : undefined,
      paymentMethod === 'QRIS' ? qrisAmount : undefined,
      paymentMethod === 'QRIS' ? qrisProof : undefined,
      paymentMethod === 'QRIS' ? qrisNote : undefined,
    );
    if (!sale) {
      setMessage('Uang kurang');
    } else {
      if (paymentMethod === 'CASH') {
        setMessage(`Transaksi sukses. Kembalian: Rp ${change.toLocaleString('id-ID')}`);
      } else {
        setMessage('Transaksi QRIS sukses.');
      }
    }
    setConfirming(false);
    setOpenConfirm(false);
    setOpenPayment(false);
    // reset qris fields
    setQrisAmount(0); setQrisProof(undefined); setQrisNote('');
  }

  function handlePaymentConfirmClick() {
    // show confirmation modal
    setOpenConfirm(true);
  }

  const promoLabel: Record<PromotionType,string> = {
    [PromotionType.NONE]: 'Reguler',
    [PromotionType.ALL_3000]: 'All Variant 3000',
    [PromotionType.FREE_ITEMS]: 'Gratis Item',
    [PromotionType.HALF_PRICE]: 'Diskon 50%'
  };

  const [mobileCollapsed, setMobileCollapsed] = useState(true);
  const itemCount = items.reduce((s,i)=>s+i.quantity,0);

  return (
    <div className={`cart mobile-floating ${mobileCollapsed ? 'collapsed' : ''}`}>
      <div className="cart-top-bar" onClick={() => setMobileCollapsed(c => !c)}>
        <h3>Keranjang</h3>
        <div className="cart-mini-info">
          <strong>{itemCount} item</strong> • Rp {totals.subtotal.toLocaleString('id-ID')}
        </div>
        <button className="cart-expand-btn" aria-label={mobileCollapsed ? 'Buka detail keranjang' : 'Tutup keranjang'} onClick={(e)=>{ e.stopPropagation(); setMobileCollapsed(c=>!c); }}>
          {mobileCollapsed ? '▲' : '▼'}
        </button>
      </div>
      <div className="cart-details">
        <div className="cart-actions">
          <button className="promo-btn" onClick={() => setOpenPromo(true)}>Promo: {promoLabel[promotion]}</button>
          <button className="pay-btn" onClick={() => setOpenPayment(true)}>Bayar</button>
        </div>
        <table className="cart-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Harga</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.product.id + (i.isFree ? '_free' : '')} className={i.isFree ? 'free' : ''}>
                <td>{i.product.name}{i.isFree && ' (FREE)'}</td>
                <td>
                  <input type="number" min={1} value={i.quantity} onChange={e => updateQuantity(i.product.id, parseInt(e.target.value) || 1)} />
                </td>
                <td>Rp {i.pricePerUnit.toLocaleString('id-ID')}</td>
                <td>Rp {(i.pricePerUnit * i.quantity).toLocaleString('id-ID')}</td>
                <td>
                  <button onClick={() => removeItem(i.product.id)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="summary">
          <span>Subtotal</span>
          <span>Rp {totals.subtotal.toLocaleString('id-ID')}</span>
        </div>
        {message && <div className="message">{message}</div>}
      </div>

      {/* Promo Modal - auto close on selection */}
      <Modal open={openPromo} onClose={() => setOpenPromo(false)} title="Pilih Promo" width={500}>
        <div className="promo-list">
          {[PromotionType.NONE, PromotionType.ALL_3000, PromotionType.FREE_ITEMS, PromotionType.HALF_PRICE].map(p => (
            <button
              key={p}
              className={`promo-item ${promotion === p ? 'active' : ''}`}
              onClick={() => { setPromotion(p); setOpenPromo(false); }}
            >
              <div className="promo-title">{promoLabel[p]}</div>
              <div className="promo-desc">
                {p === PromotionType.NONE && 'Harga normal.'}
                {p === PromotionType.ALL_3000 && 'Semua varian dihitung 3000.'}
                {p === PromotionType.FREE_ITEMS && 'Tambahkan item gratis (harga 0) dengan tombol Free.'}
                {p === PromotionType.HALF_PRICE && 'Semua item diskon 50%.'}
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={openPayment} onClose={() => setOpenPayment(false)} title="Pembayaran" width={560}
        footer={
          <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
            <button className="modal-secondary" onClick={() => setOpenPayment(false)}>Batal</button>
            <button className="modal-primary" disabled={confirming || (paymentMethod==='CASH' && cashGiven < totals.subtotal) || (paymentMethod==='QRIS' && !qrisProof)} onClick={handlePaymentConfirmClick}>
              {confirming ? 'Memproses...' : 'Konfirmasi'}
            </button>
          </div>
        }>
        <div className="payment-modal">
          <div className="method-switch">
            <button className={paymentMethod==='CASH' ? 'active' : ''} onClick={() => setPaymentMethod('CASH')}>Cash</button>
            <button className={paymentMethod==='QRIS' ? 'active' : ''} onClick={() => setPaymentMethod('QRIS')}>QRIS</button>
          </div>
          {paymentMethod === 'CASH' && (
            <div className="cash-entry">
              <div className="amount-display">Nominal: Rp {cashGiven.toLocaleString('id-ID')}</div>
              <NumericPad value={cashGiven} onChange={setCashGiven} />
              <div className="change-display">
                {cashGiven >= totals.subtotal ? `Kembalian: Rp ${(cashGiven - totals.subtotal).toLocaleString('id-ID')}` : 'Masukkan nominal cukup'}
              </div>
            </div>
          )}
          {paymentMethod === 'QRIS' && (
            <div className="qris-form">
              <div className="qris-info">Scan QRIS pelanggan lalu unggah bukti & isi nominal.</div>
              <label className="form-label">Nominal Dibayar</label>
              <input type="number" className="qris-input" value={qrisAmount} onChange={e => setQrisAmount(parseInt(e.target.value) || 0)} placeholder={`Default: ${totals.subtotal}`} />
              <label className="form-label">Bukti Pembayaran (kamera)</label>
              <CameraCapture onCapture={data => setQrisProof(data)} />
              <label className="form-label">Catatan</label>
              <textarea className="qris-textarea" rows={3} value={qrisNote} onChange={e => setQrisNote(e.target.value)} placeholder="Opsional: keterangan tambahan"></textarea>
              <div className="qris-hint">Konfirmasi akan aktif setelah bukti diunggah.</div>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal open={openConfirm} onClose={() => setOpenConfirm(false)} title="Konfirmasi Pesanan" width={560}
        footer={<div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
          <button className="modal-secondary" onClick={() => setOpenConfirm(false)}>Periksa Lagi</button>
          <button className="modal-primary" disabled={confirming} onClick={executeCheckout}>{confirming ? 'Memproses...' : 'Ya, Pesanan Sesuai'}</button>
        </div>}>
        <div className="confirm-summary">
          <p>Apakah yakin pesanan sudah sesuai?</p>
          <ul>
            {items.map(i => (
              <li key={i.product.id + (i.isFree?'_f':'')}>{i.product.name} x{i.quantity} = Rp {(i.pricePerUnit*i.quantity).toLocaleString('id-ID')}{i.isFree && ' (FREE)'}</li>
            ))}
          </ul>
          <div className="confirm-total">Total: Rp {totals.subtotal.toLocaleString('id-ID')}</div>
          {paymentMethod === 'QRIS' && (
            <div className="confirm-qris">QRIS Nominal: Rp {(qrisAmount || totals.subtotal).toLocaleString('id-ID')}</div>
          )}
          {paymentMethod === 'CASH' && (
            <div className="confirm-cash">Cash: Rp {cashGiven.toLocaleString('id-ID')} {cashGiven >= totals.subtotal && <>| Kembalian: Rp {(cashGiven-totals.subtotal).toLocaleString('id-ID')}</>}</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CartView;
