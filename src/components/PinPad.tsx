import { useState } from 'react';
import { Delete } from 'lucide-react';

interface PinPadProps {
  onSubmit: (pin: string) => void;
  length?: number;
  label?: string;
}

export function PinPad({ onSubmit, length = 4, label = 'Enter PIN' }: PinPadProps) {
  const [pin, setPin] = useState('');

  const press = (digit: string) => {
    if (pin.length < length) {
      const next = pin + digit;
      setPin(next);
      if (next.length === length) {
        setTimeout(() => {
          onSubmit(next);
          setPin('');
        }, 150);
      }
    }
  };

  const del = () => setPin(pin.slice(0, -1));

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <div className="flex gap-2.5">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`h-3.5 w-3.5 rounded-full transition-colors duration-200 ${
              i < pin.length ? 'bg-emerald-400' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            className="h-16 w-20 rounded-2xl bg-slate-800 text-2xl font-semibold text-white transition-all duration-150 hover:bg-slate-700 active:scale-95"
          >
            {d}
          </button>
        ))}
        <div className="h-16 w-20" />
        <button
          onClick={() => press('0')}
          className="h-16 w-20 rounded-2xl bg-slate-800 text-2xl font-semibold text-white transition-all duration-150 hover:bg-slate-700 active:scale-95"
        >
          0
        </button>
        <button
          onClick={del}
          className="flex h-16 w-20 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 transition-all duration-150 hover:bg-slate-700 active:scale-95"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
