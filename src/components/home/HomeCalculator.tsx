'use client';

import { useState, useCallback } from 'react';
import { Calculator as CalculatorIcon } from 'lucide-react';

type Op = '+' | '-' | '×' | '÷' | null;

export function HomeCalculator() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Op>(null);

  const handleDigit = useCallback(
    (d: string) => {
      setDisplay((v) => {
        if (d === '.') {
          if (v.includes('.')) return v;
          return v === '0' ? '0.' : v + '.';
        }
        if (prev === null && pendingOp === null && v !== '0' && !v.includes('.')) return d;
        if (v === '0') return d;
        return v + d;
      });
    },
    [prev, pendingOp]
  );

  const handleOp = useCallback(
    (nextOp: Op) => {
      const n = parseFloat(display.replace(',', '.'));
      if (prev === null) {
        setPrev(n);
        setPendingOp(nextOp);
        setDisplay('0');
        return;
      }
      const currentOp = pendingOp ?? nextOp;
      let result = prev;
      if (currentOp === '+') result = prev + n;
      else if (currentOp === '-') result = prev - n;
      else if (currentOp === '×') result = prev * n;
      else if (currentOp === '÷') result = n === 0 ? 0 : prev / n;
      setPrev(result);
      setPendingOp(nextOp);
      setDisplay('0');
    },
    [display, prev, pendingOp]
  );

  const handleEquals = useCallback(() => {
    if (prev === null || pendingOp === null) return;
    const n = parseFloat(display.replace(',', '.'));
    let result = prev;
    if (pendingOp === '+') result = prev + n;
    else if (pendingOp === '-') result = prev - n;
    else if (pendingOp === '×') result = prev * n;
    else if (pendingOp === '÷') result = n === 0 ? 0 : prev / n;
    setDisplay(String(result));
    setPrev(null);
    setPendingOp(null);
  }, [display, prev, pendingOp]);

  const clear = useCallback(() => {
    setDisplay('0');
    setPrev(null);
    setPendingOp(null);
  }, []);

  const back = useCallback(() => {
    setDisplay((v) => (v.length <= 1 ? '0' : v.slice(0, -1)));
  }, []);

  const buttons: { label: string; onClick: () => void; className?: string }[] = [
    { label: 'C', onClick: clear, className: 'bg-gray-200 text-gray-800 hover:bg-gray-300' },
    { label: '⌫', onClick: back, className: 'bg-gray-200 text-gray-800 hover:bg-gray-300' },
    { label: '%', onClick: () => setDisplay(String(parseFloat(display.replace(',', '.')) / 100)), className: 'bg-gray-200 text-gray-800 hover:bg-gray-300' },
    { label: '÷', onClick: () => handleOp('÷'), className: 'bg-primary-600 text-white hover:bg-primary-700' },
    { label: '7', onClick: () => handleDigit('7') },
    { label: '8', onClick: () => handleDigit('8') },
    { label: '9', onClick: () => handleDigit('9') },
    { label: '×', onClick: () => handleOp('×'), className: 'bg-primary-600 text-white hover:bg-primary-700' },
    { label: '4', onClick: () => handleDigit('4') },
    { label: '5', onClick: () => handleDigit('5') },
    { label: '6', onClick: () => handleDigit('6') },
    { label: '-', onClick: () => handleOp('-'), className: 'bg-primary-600 text-white hover:bg-primary-700' },
    { label: '1', onClick: () => handleDigit('1') },
    { label: '2', onClick: () => handleDigit('2') },
    { label: '3', onClick: () => handleDigit('3') },
    { label: '+', onClick: () => handleOp('+'), className: 'bg-primary-600 text-white hover:bg-primary-700' },
    { label: '0', onClick: () => handleDigit('0') },
    { label: '.', onClick: () => handleDigit('.') },
    { label: '=', onClick: handleEquals, className: 'col-span-2 bg-primary-600 text-white hover:bg-primary-700' },
  ];

  return (
    <div className="w-full max-w-xs mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-primary-50 border-b border-primary-100">
        <CalculatorIcon className="w-5 h-5 text-primary-600 shrink-0" />
        <span className="text-sm font-medium text-primary-700">Calculatrice</span>
      </div>
      <div className="p-3 sm:p-4">
        <div
          className="w-full text-right text-2xl sm:text-3xl font-mono font-semibold text-gray-900 py-3 px-3 bg-gray-50 rounded-xl mb-3 min-h-[3rem] break-all"
          aria-live="polite"
        >
          {display}
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {buttons.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={b.onClick}
              className={
                b.className
                  ? `font-medium rounded-xl py-3 sm:py-4 text-lg sm:text-xl transition-colors active:scale-95 ${b.className}`
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 font-medium rounded-xl py-3 sm:py-4 text-lg sm:text-xl transition-colors active:scale-95'
              }
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
