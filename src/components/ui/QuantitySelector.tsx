'use client';

import {cn} from '@/lib/utils';
import {Minus, Plus} from 'lucide-react';

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  label,
  className
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-brand-secondary">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={value <= min}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded border',
            'border-brand-border text-brand-secondary',
            'hover:bg-brand-light transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="flex min-w-[80px] items-center justify-center">
          <span className="text-lg font-semibold text-brand-secondary">
            {value}
          </span>
          <span className="ms-1 text-sm text-brand-muted">
            m
          </span>
        </div>

        <button
          type="button"
          onClick={handleIncrease}
          disabled={value >= max}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded border',
            'border-brand-border text-brand-secondary',
            'hover:bg-brand-light transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
