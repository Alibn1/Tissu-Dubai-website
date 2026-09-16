'use client';

import {cn} from '@/lib/utils';
import {ChevronDown} from 'lucide-react';
import type {Model} from '@/types';

const inputClass = cn(
  'w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-secondary',
  'placeholder:text-brand-muted/70',
  'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
);

export function ModelSelect({
  models,
  value,
  onChange,
  placeholder,
}: {
  models: Model[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, 'appearance-none pr-9')}
      >
        <option value="">{placeholder}</option>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name.fr}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
    </div>
  );
}