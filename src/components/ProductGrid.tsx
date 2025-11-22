import React, { useState, useMemo } from 'react';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { PromotionType } from '../types';

const ProductGrid: React.FC = () => {
  const { items, addProduct, addFreeProduct, promotion, updateQuantity, removeItem } = useCart();

  function getQty(productId: string) {
    const found = items.find(i => i.product.id === productId && !i.isFree);
    return found ? found.quantity : 0;
  }

  function inc(productId: string) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    addProduct(prod);
  }

  function dec(productId: string) {
    const found = items.find(i => i.product.id === productId && !i.isFree);
    if (!found) return;
    if (found.quantity <= 1) {
      removeItem(productId);
    } else {
      updateQuantity(productId, found.quantity - 1);
    }
  }

  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(p => p.basePrice > 0 && (!term || p.name.toLowerCase().includes(term)) );
  }, [search]);

  function renderName(name: string) {
    const term = search.trim().toLowerCase();
    if (!term) return name;
    const idx = name.toLowerCase().indexOf(term);
    if (idx === -1) return name;
    const before = name.slice(0, idx);
    const match = name.slice(idx, idx + term.length);
    const after = name.slice(idx + term.length);
    return <>{before}<mark>{match}</mark>{after}</>;
  }

  return (
    <div className="product-panel">
      <div className="product-search">
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="clear-search" onClick={() => setSearch('')} aria-label="Hapus pencarian">✕</button>}
      </div>
      <div className="product-grid">
        {filtered.map(p => {
          const qty = getQty(p.id);
          return (
            <div key={p.id} className="product-card" data-name={p.name}>
              <div className="img-wrapper">
                {(p.image && !p.image.includes('generic_5000.svg')) && <img src={p.image} alt={p.name} />}
                {(!p.image || p.image.includes('generic_5000.svg')) && (
                  <div className="placeholder-name" title={p.name}>{renderName(p.name)}</div>
                )}
                {promotion === PromotionType.ALL_3000 && <span className="ribbon ribbon-green">3000</span>}
                {promotion === PromotionType.HALF_PRICE && <span className="ribbon ribbon-gold">50%</span>}
                {promotion === PromotionType.FREE_ITEMS && <span className="ribbon ribbon-pink">FREE+</span>}
              </div>
              <div className="info">
                <h4>{renderName(p.name)}</h4>
                <div className="price">Rp {p.basePrice.toLocaleString('id-ID')}</div>
              </div>
              <div className="controls">
                <button className="qty-btn" onClick={() => dec(p.id)} disabled={qty === 0}>−</button>
                <div className="qty-display">{qty}</div>
                <button className="qty-btn" onClick={() => inc(p.id)}>+</button>
              </div>
              {promotion === PromotionType.FREE_ITEMS && (
                <button className="free-add" onClick={() => addFreeProduct(p)}>+ Gratis</button>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="no-results">Tidak ada produk cocok untuk "{search}"</div>
        )}
      </div>
    </div>
  );
};
export default ProductGrid;
