import React from 'react';

interface NumericPadProps {
  value: number;
  onChange: (val: number) => void;
}

const buttons = ['1','2','3','4','5','6','7','8','9','00','0','⌫'];

const NumericPad: React.FC<NumericPadProps> = ({ value, onChange }) => {
  function press(btn: string) {
    if (btn === '⌫') {
      const s = value.toString();
      const next = s.length > 1 ? parseInt(s.slice(0, -1)) : 0;
      onChange(next);
      return;
    }
    const nextStr = (value === 0 ? '' : value.toString()) + btn;
    const next = parseInt(nextStr, 10) || 0;
    onChange(next);
  }
  return (
    <div className="numeric-pad">
      {buttons.map(b => (
        <button key={b} onClick={() => press(b)}>{b}</button>
      ))}
      <button className="clear" onClick={() => onChange(0)}>Clear</button>
    </div>
  );
};

export default NumericPad;
