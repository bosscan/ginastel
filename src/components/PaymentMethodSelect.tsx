import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PaymentMethodSelectProps {
  value: string; // 'ALL' | 'CASH' | 'QRIS'
  onChange: (val: string) => void;
}

const OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Semua Metode' },
  { value: 'CASH', label: 'Cash' },
  { value: 'QRIS', label: 'QRIS' }
];

const PaymentMethodSelect: React.FC<PaymentMethodSelectProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number>(() => OPTIONS.findIndex(o => o.value === value));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, close]);

  useEffect(() => {
    // Align focusIndex with current value when value changes from outside
    const idx = OPTIONS.findIndex(o => o.value === value);
    setFocusIndex(idx >= 0 ? idx : 0);
  }, [value]);

  function handleSelect(val: string, idx: number) {
    onChange(val);
    setFocusIndex(idx);
    close();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        // select currently focused
        const opt = OPTIONS[focusIndex];
        if (opt) handleSelect(opt.value, focusIndex);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        setFocusIndex(i => Math.min(OPTIONS.length - 1, i + 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open) setFocusIndex(i => Math.max(0, i - 1));
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        close();
      }
    }
  }

  useEffect(() => {
    if (open && listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]');
      if (active instanceof HTMLElement) {
        active.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [open, focusIndex]);

  return (
    <div
      ref={containerRef}
      className={`custom-dropdown ${open ? 'open' : ''}`}
      tabIndex={0}
      role="listbox"
      aria-expanded={open}
      aria-activedescendant={open ? `payment-opt-${focusIndex}` : undefined}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="custom-dropdown-button filter-payment"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-label="Pilih Metode Pembayaran"
      >
        {OPTIONS.find(o => o.value === value)?.label || 'Pilih Metode'}
        <span className="dropdown-arrow" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="custom-dropdown-panel" role="presentation" ref={listRef}>
          {OPTIONS.map((opt, idx) => {
            const active = idx === focusIndex;
            return (
              <li
                id={`payment-opt-${idx}`}
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                data-active={active ? 'true' : 'false'}
                className={`dropdown-option ${active ? 'focus' : ''} ${opt.value === value ? 'selected' : ''}`}
                onMouseEnter={() => setFocusIndex(idx)}
                onClick={() => handleSelect(opt.value, idx)}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PaymentMethodSelect;
