'use client';

import {cn} from '@/lib/utils';

type ColorSelectorProps = {
  colors: {name: string; hex: string}[];
  selectedColor: string;
  onChange: (color: {name: string; hex: string}) => void;
  label?: string;
  className?: string;
};

export function ColorSelector({colors, selectedColor, onChange, label, className}: ColorSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-brand-secondary">
          {label}: <span className="font-normal text-brand-muted">{selectedColor}</span>
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {colors.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'relative h-8 w-8 rounded-full border-2 transition-all duration-200',
              selectedColor === color.name
                ? 'border-brand-primary scale-110'
                : 'border-brand-border hover:border-brand-muted'
            )}
            style={{backgroundColor: color.hex}}
            aria-label={color.name}
            title={color.name}
          >
            {selectedColor === color.name && (
              <span
                className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  'text-white drop-shadow-sm'
                )}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
