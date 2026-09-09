'use client';

import {useEffect, type ReactNode} from 'react';
import {X} from 'lucide-react';
import {cn} from '@/lib/utils';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({open, onClose, title, children}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-brand-border bg-brand-surface shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border/60 px-5 py-4">
          <h2 className="font-heading text-base font-bold text-brand-secondary sm:text-lg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              'text-brand-muted hover:bg-brand-light hover:text-brand-secondary',
              'transition-colors duration-200'
            )}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}