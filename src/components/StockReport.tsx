import React from 'react';
import { useStock } from '../context/StockContext';

const StockReport: React.FC = () => {
  const { stock } = useStock();

  return (
    <div className="report">
      <h2>Report Stok</h2>
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
              <td>{s.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default StockReport;
