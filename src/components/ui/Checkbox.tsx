'use client';

import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';
import {Check} from 'lucide-react';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  className?: string;
};

export function Checkbox({checked, onChange, children, className}: CheckboxProps) {
  return (
    <label className={cn('group flex cursor-pointer items-center gap-2.5 py-1', className)}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
          'border-brand-border bg-brand-light',
          'transition-all duration-200',
          'group-hover:border-brand-primary/70 group-hover:bg-brand-surface',
          'peer-checked:border-brand-primary peer-checked:bg-brand-primary',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary/50 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-brand-surface',
          checked && 'shadow-[0_0_0_3px_rgba(201,162,39,0.12)]'
        )}
      >
        <Check
          className={cn(
            'h-3.5 w-3.5 text-white transition-opacity duration-200',
            checked ? 'opacity-100' : 'opacity-0'
          )}
          strokeWidth={3}
        />
      </span>
      <span className="text-sm text-brand-secondary">{children}</span>
    </label>
  );
}