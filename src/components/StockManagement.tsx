import React from 'react';
import { useStock } from '../context/StockContext';

const StockManagement: React.FC = () => {
  const { stock, setQuantity, reset } = useStock();

  return (
    <div className="stock-mgmt">
      <h2>Input / Update Stok</h2>
      <button onClick={reset}>Reset</button>
      <table>
        <thead>
          <tr>
            <th>Produk</th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>
          {stock.map(s => (
            <tr key={s.productId}>
              <td>{s.name}</td>
              <td>
                <input type="number" value={s.quantity} min={0} onChange={e => setQuantity(s.productId, parseInt(e.target.value) || 0)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default StockManagement;
